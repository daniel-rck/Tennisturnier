import { useEffect, useRef, useState } from 'react'
import { useTournament } from './hooks/useTournament'
import { useSync } from './hooks/useSync'
import { generateSchedule } from './scheduler'
import { migrate } from './storage'
import { SetupPanel } from './components/SetupPanel'
import { PlayersPanel } from './components/PlayersPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { RankingPanel } from './components/RankingPanel'
import { PrintView } from './components/PrintView'
import { EntriesPanel } from './components/EntriesPanel'
import { GroupsPanel } from './components/GroupsPanel'
import { BracketPanel } from './components/BracketPanel'
import { SyncPanel } from './components/SyncPanel'

type Tab =
  | 'setup'
  | 'players'
  | 'entries'
  | 'schedule'
  | 'groups'
  | 'bracket'
  | 'ranking'
  | 'print'

function App() {
  const t = useTournament()
  const sync = useSync({
    tournament: t.tournament,
    setSync: t.setSync,
    applyRemote: t.replaceTournament,
  })
  const [tab, setTab] = useState<Tab>('setup')
  const [warnings, setWarnings] = useState<string[]>([])
  const isOwner = sync.role !== 'viewer'

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
        // Strip ?join= from the URL so a refresh doesn't re-join over local state.
        params.delete('join')
        const next = `${window.location.pathname}${
          params.toString() ? '?' + params.toString() : ''
        }`
        window.history.replaceState({}, '', next)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = () => {
    t.snapshot()
    const result = generateSchedule(t.tournament)
    t.setSchedule(result.rounds)
    setWarnings(result.warnings)
  }

  const handleReset = () => {
    t.snapshot()
    t.reset()
  }

  const handleReshuffle = () => {
    t.snapshot()
    t.reshuffleGroups()
  }

  const handleExport = () => {
    // Strip ownerToken from export — it's device-bound and would let the recipient hijack the sync.
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
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const next = migrate(parsed)
      if (
        confirm(
          `Turnier „${next.name}" laden? Das aktuelle Turnier wird überschrieben.`,
        )
      ) {
        t.snapshot()
        t.replaceTournament(next)
      }
    } catch {
      alert('Datei konnte nicht gelesen werden — gültige JSON-Datei erwartet.')
    }
  }

  const tabs: { id: Tab; label: string }[] = (() => {
    const f = t.tournament.format
    const list: { id: Tab; label: string }[] = [
      { id: 'setup', label: 'Einstellungen' },
    ]
    if (f === 'rotation') {
      list.push({ id: 'players', label: 'Spieler:innen' })
      list.push({ id: 'schedule', label: 'Spielplan' })
    } else {
      list.push({ id: 'entries', label: 'Teams' })
      if (f === 'groups' || f === 'groups-ko')
        list.push({ id: 'groups', label: 'Gruppen' })
      if (f === 'knockout' || f === 'groups-ko')
        list.push({ id: 'bracket', label: 'Bracket' })
    }
    list.push({ id: 'ranking', label: 'Siegerehrung' })
    list.push({ id: 'print', label: 'Drucken' })
    return list
  })()

  // If selected tab disappeared after format change, fall back to setup
  useEffect(() => {
    if (!tabs.some((tt) => tt.id === tab)) setTab('setup')
  }, [tabs, tab])

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🎾
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              Tennisturnier-Planer
            </h1>
            <p className="text-xs text-emerald-100">
              {t.tournament.name || 'Vereinsturnier'}
            </p>
          </div>
          <div className="flex-1" />
          {sync.role !== 'none' && (
            <span
              title={sync.error ?? sync.status}
              className={
                'text-xs px-2 py-0.5 rounded-full font-medium mr-2 ' +
                (sync.status === 'live'
                  ? 'bg-emerald-500 text-white'
                  : sync.status === 'connecting'
                    ? 'bg-amber-300 text-amber-900'
                    : 'bg-rose-300 text-rose-900')
              }
            >
              ● {sync.role === 'owner' ? 'sync' : 'viewer'}
            </span>
          )}
          <button
            type="button"
            onClick={t.undo}
            disabled={!t.canUndo || !isOwner}
            title={isOwner ? 'Rückgängig (Strg/Cmd+Z)' : 'Im Viewer-Modus deaktiviert'}
            aria-label="Rückgängig"
            className="text-emerald-100 hover:text-white disabled:text-emerald-300 disabled:cursor-not-allowed text-sm px-2 py-1"
          >
            ↶ Rückgängig
          </button>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tt) => (
            <button
              key={tt.id}
              type="button"
              onClick={() => setTab(tt.id)}
              className={
                'px-3 py-2 text-sm whitespace-nowrap border-b-2 transition ' +
                (tab === tt.id
                  ? 'border-white font-semibold'
                  : 'border-transparent text-emerald-100 hover:text-white')
              }
            >
              {tt.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {tab === 'setup' && (
            <div className="space-y-6">
              <SyncPanel
                tournament={t.tournament}
                status={sync.status}
                role={sync.role}
                error={sync.error}
                onCreate={sync.createSession}
                onJoin={sync.joinSession}
                onLeave={sync.leaveSession}
              />
              <SetupPanel
              name={t.tournament.name}
              format={t.tournament.format}
              entryFormat={t.tournament.entryFormat}
              courts={t.tournament.courts}
              rounds={t.tournament.rounds}
              mode={t.tournament.mode}
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
              onGroupCount={t.setGroupCount}
              onAdvancePerGroup={t.setAdvancePerGroup}
              onThirdPlaceMatch={t.setThirdPlaceMatch}
              onPerGenderRanking={t.setPerGenderRanking}
              onReset={handleReset}
              onExport={handleExport}
              onImport={handleImport}
              />
            </div>
          )}
          {tab === 'players' && (
            <PlayersPanel
              players={t.tournament.players}
              onAdd={t.addPlayer}
              onUpdate={t.updatePlayer}
              onRemove={t.removePlayer}
              onSort={t.sortPlayersBy}
              onArrayMove={t.setPlayersOrder}
            />
          )}
          {tab === 'entries' && (
            <EntriesPanel
              entries={t.tournament.entries}
              entryFormat={t.tournament.entryFormat}
              onAdd={t.addEntry}
              onUpdate={t.updateEntry}
              onRemove={t.removeEntry}
              onReorder={t.setEntriesOrder}
              onSortByName={t.sortEntriesByName}
            />
          )}
          {tab === 'schedule' && (
            <SchedulePanel
              tournament={t.tournament}
              onGenerate={handleGenerate}
              onTimerMinutes={t.setTimerMinutes}
              onScore={t.setMatchScore}
              warnings={warnings}
            />
          )}
          {tab === 'groups' && (
            <GroupsPanel
              tournament={t.tournament}
              onSetGroupSchedule={t.setGroupSchedule}
              onScore={t.setGroupScore}
              onSetGroupCount={t.setGroupCount}
              onInitGroupAssignment={t.initGroupAssignment}
              onReshuffle={handleReshuffle}
            />
          )}
          {tab === 'bracket' && (
            <BracketPanel
              tournament={t.tournament}
              onSetBracket={t.setBracket}
              onScore={t.setBracketScore}
            />
          )}
          {tab === 'ranking' && (
            <RankingPanel
              tournament={t.tournament}
              isOwner={isOwner}
              onSetRevealActive={t.setRevealActive}
              onSetRevealStep={t.setRevealStep}
              onResetReveal={t.resetReveal}
            />
          )}
          {tab === 'print' && <PrintView tournament={t.tournament} />}
        </div>
      </main>

      <footer className="no-print text-center text-xs text-slate-500 py-4">
        Lokal im Browser gespeichert · keine Daten verlassen dein Gerät
      </footer>
    </div>
  )
}

export default App
