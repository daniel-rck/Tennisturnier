import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTournament } from './hooks/useTournament'
import { useSync } from './hooks/useSync'
import { generateSchedule } from './scheduler'
import { loadTournament, migrate } from './storage'
import { SetupWizard } from './components/SetupWizard'
import { PlayersPanel } from './components/PlayersPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { RankingPanel } from './components/RankingPanel'
import { StatisticsPanel } from './components/StatisticsPanel'
import { PrintView } from './components/PrintView'
import { EntriesPanel } from './components/EntriesPanel'
import { GroupsPanel } from './components/GroupsPanel'
import { BracketPanel } from './components/BracketPanel'
import { Dashboard } from './components/Dashboard'
import { SettingsSheet } from './components/SettingsSheet'
import { InstallPrompt } from './components/InstallPrompt'
import { UpdatePrompt } from './components/UpdatePrompt'
import { OfflineBanner } from './components/OfflineBanner'
import { OnboardingDialog } from './components/OnboardingDialog'
import { PhaseNav, SubNav, type PhaseId } from './components/ui/PhaseNav'
import { useConfirm } from './hooks/useConfirm'
import { useToast } from './hooks/useToast'
import { useTranslation } from './i18n'

const ONBOARDING_KEY = 'tennisturnier:welcomeDismissed'

function readOnboardingDone(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === '1'
  } catch {
    return false
  }
}

function inferPhase(t: ReturnType<typeof useTournament>['tournament']): PhaseId {
  const f = t.format
  if (f === 'rotation') {
    if (t.schedule.length === 0) return 'prep'
    const all = t.schedule.flatMap((r) => r.matches)
    const allDone = all.length > 0 && all.every((m) => m.scoreA != null && m.scoreB != null)
    return allDone ? 'results' : 'live'
  }
  if (f === 'groups') {
    if (t.entries.length < 2 || t.groupSchedule.length === 0) return 'prep'
    const allDone = t.groupSchedule.every((m) => m.scoreA != null && m.scoreB != null)
    return allDone ? 'results' : 'live'
  }
  // knockout / groups-ko
  if (t.entries.length < 2 || t.bracket.length === 0) return 'prep'
  const allDone = t.bracket.every((m) => m.scoreA != null && m.scoreB != null)
  return allDone ? 'results' : 'live'
}

function App() {
  const { t: tr } = useTranslation()
  const t = useTournament()
  const sync = useSync({
    tournament: t.tournament,
    setSync: t.setSync,
    applyRemote: t.replaceTournament,
  })
  const isOwner = sync.role !== 'viewer'
  const confirm = useConfirm()
  const { toast } = useToast()

  const [warnings, setWarnings] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingDone())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Phase + sub-tab state. We peek synchronously into localStorage so the
  // first render lands on the right phase (useTournament hydrates in an
  // effect, which would otherwise leave us on 'prep' for one paint).
  const [phase, setPhase] = useState<PhaseId>(() => {
    try {
      return inferPhase(loadTournament())
    } catch {
      return 'prep'
    }
  })
  const [subTab, setSubTab] = useState<string>('')

  // Smart re-default: when phase becomes invalid (e.g. user reset / imported
  // an empty tournament), step back to prep.
  useEffect(() => {
    const inferred = inferPhase(t.tournament)
    if ((phase === 'live' || phase === 'results') && inferred === 'prep') {
      setPhase('prep')
    }
  }, [t.tournament, phase])

  // Derived: sub-tabs per phase
  const subTabs = useMemo(() => {
    const f = t.tournament.format
    if (phase === 'prep') {
      const tabs = [{ id: 'setup', label: tr('tab.setup') }]
      if (f === 'rotation') tabs.push({ id: 'players', label: tr('tab.players') })
      else tabs.push({ id: 'entries', label: tr('tab.entries') })
      return tabs
    }
    if (phase === 'live') {
      const tabs = [{ id: 'overview', label: tr('tab.overview') }]
      if (f === 'rotation') tabs.push({ id: 'schedule', label: tr('tab.schedule') })
      if (f === 'groups' || f === 'groups-ko')
        tabs.push({ id: 'groups', label: tr('tab.groups') })
      if (f === 'knockout' || f === 'groups-ko')
        tabs.push({ id: 'bracket', label: tr('tab.bracket') })
      tabs.push({ id: 'statistics', label: tr('tab.statistics') })
      return tabs
    }
    // results
    return [
      { id: 'ranking', label: tr('tab.ranking') },
      { id: 'statistics', label: tr('tab.statistics') },
      { id: 'print', label: tr('tab.print') },
    ]
  }, [phase, t.tournament.format, tr])

  // Reset sub-tab to first valid when phase changes or list changes
  useEffect(() => {
    if (!subTabs.some((s) => s.id === subTab)) {
      setSubTab(subTabs[0]?.id ?? '')
    }
  }, [subTabs, subTab])

  // Auto-join via ?join=<code> URL param — runs once on first mount.
  const joinedRef = useRef(false)
  useEffect(() => {
    if (joinedRef.current) return
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join')
    if (!code) return
    joinedRef.current = true
    sync
      .joinSession(code)
      .catch(() => {})
      .finally(() => {
        params.delete('join')
        const next = `${window.location.pathname}${
          params.toString() ? '?' + params.toString() : ''
        }`
        window.history.replaceState({}, '', next)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    window.setTimeout(() => {
      try {
        t.snapshot()
        const result = generateSchedule(t.tournament)
        t.setSchedule(result.rounds)
        setWarnings(result.warnings)
        if (result.warnings.length === 0) {
          toast({ variant: 'success', title: tr('toast.scheduleCreated') })
        } else {
          toast({
            variant: 'info',
            title: tr('toast.scheduleCreated'),
            description: tr(
              result.warnings.length === 1
                ? 'toast.scheduleHints'
                : 'toast.scheduleHintsPlural',
              { count: result.warnings.length },
            ),
          })
        }
        // Move to live phase after generating
        setPhase('live')
      } catch (err) {
        toast({
          variant: 'error',
          title: tr('toast.scheduleFailed'),
          description: err instanceof Error ? err.message : undefined,
        })
      } finally {
        setIsGenerating(false)
      }
    }, 0)
  }, [t, toast, tr])

  const handleReset = () => {
    t.snapshot()
    t.reset()
    setPhase('prep')
  }

  const handleNewTournament = useCallback(async () => {
    const ok = await confirm({
      title: tr('settings.newTournamentConfirm.title'),
      description: tr('settings.newTournamentConfirm.description'),
      confirmLabel: tr('settings.newTournamentConfirm.button'),
      destructive: true,
    })
    if (ok) handleReset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr])

  const handleReshuffle = () => {
    t.snapshot()
    t.reshuffleGroups()
  }

  const handleExport = () => {
    const exportable = t.tournament.sync
      ? { ...t.tournament, sync: { ...t.tournament.sync, ownerToken: undefined } }
      : t.tournament
    const blob = new Blob([JSON.stringify(exportable, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeName = (t.tournament.name || 'turnier')
      .replace(/[^a-z0-9-_]+/gi, '_')
      .toLowerCase()
    a.href = url
    a.download = `${safeName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    let next
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      next = migrate(parsed)
    } catch {
      toast({
        variant: 'error',
        title: tr('toast.importFailed'),
        description: tr('toast.importFailedDesc'),
      })
      return
    }
    const ok = await confirm({
      title: tr('toast.loadConfirm.title'),
      description: tr('toast.loadConfirm.description', { name: next.name }),
      confirmLabel: tr('toast.loadConfirm.button'),
      destructive: true,
    })
    if (ok) {
      t.snapshot()
      t.replaceTournament(next)
      // re-infer phase from new data
      setPhase(inferPhase(next))
      toast({ variant: 'success', title: tr('toast.loaded') })
    }
  }

  const finishOnboarding = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      // ignore
    }
    setShowOnboarding(false)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd+Z triggers undo (when not editing form fields)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement | null
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
        if (t.canUndo) {
          e.preventDefault()
          t.undo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [t])

  const phases: { id: PhaseId; label: string; icon: string }[] = [
    { id: 'prep', label: tr('phase.prep'), icon: '⚙' },
    { id: 'live', label: tr('phase.live'), icon: '▶' },
    { id: 'results', label: tr('phase.results'), icon: '🏆' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <OfflineBanner />

      {/* Header */}
      <header className="no-print sticky top-0 z-10 bg-court-pattern text-cream backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <TennisLogo />
          <div className="min-w-0 flex-1">
            <h1 className="serif text-lg font-semibold leading-tight tracking-tight truncate">
              {t.tournament.name || tr('app.defaultName')}
            </h1>
            <p className="text-[11px] text-cream/70 uppercase tracking-wider truncate">
              {tr('app.title')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {sync.role !== 'none' && (
              <SyncIndicator
                status={sync.status}
                role={sync.role}
                label={tr(sync.role === 'owner' ? 'app.role.owner' : 'app.role.viewer')}
              />
            )}
            <InstallPrompt />
            <button
              type="button"
              onClick={t.undo}
              disabled={!t.canUndo || !isOwner}
              title={isOwner ? tr('app.undoTitle') : tr('app.undoDisabledTitle')}
              aria-label={tr('app.undo')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-cream/85 hover:text-cream hover:bg-white/10 disabled:text-cream/30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            >
              <span aria-hidden className="text-lg">↶</span>
            </button>
            <button
              type="button"
              onClick={handleNewTournament}
              disabled={!isOwner}
              aria-label={tr('settings.newTournament')}
              title={tr('settings.newTournament')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-cream/85 hover:text-cream hover:bg-white/10 disabled:text-cream/30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            >
              <span aria-hidden className="text-lg leading-none">＋</span>
              <span className="sr-only sm:not-sr-only sm:ml-1 sm:text-sm">{tr('header.new')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={tr('settings.openMenu')}
              title={tr('settings.openMenu')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-cream/85 hover:text-cream hover:bg-white/10 transition-colors"
            >
              <span aria-hidden className="text-lg">⋯</span>
            </button>
          </div>
        </div>

        {/* Desktop/tablet: phase nav inline in header */}
        <div className="max-w-3xl mx-auto px-4 pb-3 hidden sm:flex justify-center">
          <PhaseNav current={phase} onChange={setPhase} phases={phases} variant="top" />
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="bg-surface border-b border-border sticky top-[60px] sm:top-[108px] z-[5]">
        <div className="max-w-3xl mx-auto px-4">
          <SubNav current={subTab} onChange={setSubTab} tabs={subTabs} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 pb-24 sm:pb-8">
        <div key={`${phase}-${subTab}`} className="max-w-3xl mx-auto px-4 py-5 animate-fade-in">
          {/* PREP PHASE */}
          {phase === 'prep' && subTab === 'setup' && (
            <SetupWizard
              name={t.tournament.name}
              format={t.tournament.format}
              entryFormat={t.tournament.entryFormat}
              courts={t.tournament.courts}
              rounds={t.tournament.rounds}
              mode={t.tournament.mode}
              allowPartialFinalRound={t.tournament.allowPartialFinalRound}
              groupCount={t.tournament.groupCount}
              advancePerGroup={t.tournament.advancePerGroup}
              thirdPlaceMatch={t.tournament.thirdPlaceMatch}
              perGenderRanking={t.tournament.perGenderRanking}
              onName={t.setName}
              onFormat={t.setFormat}
              onEntryFormat={t.setEntryFormat}
              onCourts={t.setCourts}
              onRounds={t.setRounds}
              onMode={t.setMode}
              onAllowPartialFinalRound={t.setAllowPartialFinalRound}
              onGroupCount={t.setGroupCount}
              onAdvancePerGroup={t.setAdvancePerGroup}
              onThirdPlaceMatch={t.setThirdPlaceMatch}
              onPerGenderRanking={t.setPerGenderRanking}
              onFinish={() => {
                const next = subTabs.find((s) => s.id !== 'setup')
                if (next) setSubTab(next.id)
              }}
            />
          )}
          {phase === 'prep' && subTab === 'players' && (
            <PlayersPanel
              players={t.tournament.players}
              onAdd={t.addPlayer}
              onUpdate={t.updatePlayer}
              onRemove={t.removePlayer}
              onSort={t.sortPlayersBy}
              onArrayMove={t.setPlayersOrder}
              onContinue={() => {
                if (t.tournament.schedule.length === 0) handleGenerate()
                else setPhase('live')
              }}
              continueLabel={
                t.tournament.schedule.length === 0
                  ? tr('dashboard.scheduleButton')
                  : tr('phase.live')
              }
            />
          )}
          {phase === 'prep' && subTab === 'entries' && (
            <EntriesPanel
              entries={t.tournament.entries}
              entryFormat={t.tournament.entryFormat}
              onAdd={t.addEntry}
              onUpdate={t.updateEntry}
              onRemove={t.removeEntry}
              onReorder={t.setEntriesOrder}
              onSortByName={t.sortEntriesByName}
              onContinue={() => setPhase('live')}
              continueLabel={tr('phase.live')}
            />
          )}

          {/* LIVE PHASE */}
          {phase === 'live' && subTab === 'overview' && (
            <Dashboard
              tournament={t.tournament}
              isOwner={isOwner}
              onTimerMinutes={t.setTimerMinutes}
              onBellVariant={t.setBellVariant}
              onMatchScore={t.setMatchScore}
              onGroupScore={t.setGroupScore}
              onBracketScore={t.setBracketScore}
              onGotoSetup={() => setPhase('prep')}
              onGotoSchedule={() => {
                const target =
                  t.tournament.format === 'rotation' ? 'schedule'
                    : t.tournament.format === 'knockout' ? 'bracket'
                      : 'groups'
                setSubTab(target)
              }}
              onGenerate={handleGenerate}
            />
          )}
          {phase === 'live' && subTab === 'schedule' && (
            <SchedulePanel
              tournament={t.tournament}
              onGenerate={handleGenerate}
              onTimerMinutes={t.setTimerMinutes}
              onBellVariant={t.setBellVariant}
              onScore={t.setMatchScore}
              warnings={warnings}
              isGenerating={isGenerating}
            />
          )}
          {phase === 'live' && subTab === 'groups' && (
            <GroupsPanel
              tournament={t.tournament}
              onSetGroupSchedule={t.setGroupSchedule}
              onScore={t.setGroupScore}
              onSetGroupCount={t.setGroupCount}
              onInitGroupAssignment={t.initGroupAssignment}
              onReshuffle={handleReshuffle}
            />
          )}
          {phase === 'live' && subTab === 'bracket' && (
            <BracketPanel
              tournament={t.tournament}
              onSetBracket={t.setBracket}
              onScore={t.setBracketScore}
            />
          )}
          {phase === 'live' && subTab === 'statistics' && (
            <StatisticsPanel tournament={t.tournament} />
          )}

          {/* RESULTS PHASE */}
          {phase === 'results' && subTab === 'ranking' && (
            <RankingPanel
              tournament={t.tournament}
              isOwner={isOwner}
              onSetRevealActive={t.setRevealActive}
              onSetRevealStep={t.setRevealStep}
              onResetReveal={t.resetReveal}
            />
          )}
          {phase === 'results' && subTab === 'statistics' && (
            <StatisticsPanel tournament={t.tournament} />
          )}
          {phase === 'results' && subTab === 'print' && (
            <PrintView tournament={t.tournament} />
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <PhaseNav current={phase} onChange={setPhase} phases={phases} variant="bottom" />

      <footer className="no-print text-center text-xs text-fg-subtle py-4 pb-20 sm:pb-4">
        <div className="opacity-70">
          {tr('app.tagline')}
        </div>
      </footer>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tournament={t.tournament}
        isOwner={isOwner}
        syncStatus={sync.status}
        syncRole={sync.role}
        syncError={sync.error}
        onSyncCreate={sync.createSession}
        onSyncJoin={sync.joinSession}
        onSyncLeave={sync.leaveSession}
        onExport={handleExport}
        onImport={handleImport}
      />
      <UpdatePrompt />
      {showOnboarding && (
        <OnboardingDialog onDone={finishOnboarding} onImport={handleImport} />
      )}
    </div>
  )
}

function TennisLogo() {
  return (
    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-cream/15 border border-cream/20 shrink-0">
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        aria-hidden
        fill="none"
      >
        <circle cx="12" cy="12" r="10" fill="#e5f04a" stroke="#1a3a2e" strokeWidth="1.5" />
        <path
          d="M3.5 8.5 c 4 1.5 9 1.5 17 0"
          stroke="#1a3a2e"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M3.5 15.5 c 4 -1.5 9 -1.5 17 0"
          stroke="#1a3a2e"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </span>
  )
}

function SyncIndicator({
  status,
  role,
}: {
  status: 'disabled' | 'connecting' | 'live' | 'offline' | 'error'
  role: 'none' | 'owner' | 'viewer'
  label: string
}) {
  const color =
    status === 'live'
      ? 'bg-emerald-300'
      : status === 'connecting'
        ? 'bg-amber-300 animate-pulse'
        : 'bg-rose-400'
  return (
    <span
      role="status"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5"
    >
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] uppercase tracking-wider font-semibold text-cream/85">
        {role === 'viewer' ? 'View' : 'Live'}
      </span>
    </span>
  )
}

export default App
