import { useMemo } from 'react'
import type { BellVariant, GroupMatch, Match, Round, Tournament } from '../types'
import { useTranslation } from '../i18n'
import { Card } from './ui/Card'
import { Pill } from './ui/Pill'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'
import { EmptyState } from './EmptyState'
import { RoundTimer } from './RoundTimer'
import { MatchCard } from './MatchCard'
import { groupLetter, resolveBracket } from '../knockoutScheduler'
import type { ResolvedBracketMatch } from '../knockoutScheduler'
import { useCallback } from 'react'

interface Props {
  tournament: Tournament
  isOwner: boolean
  onTimerMinutes: (n: number) => void
  onBellVariant: (v: BellVariant) => void
  onMatchScore: (
    roundIndex: number,
    court: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
  onGroupScore: (
    group: number,
    matchIndex: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
  onBracketScore: (matchId: string, a: number | undefined, b: number | undefined) => void
  onGotoSetup: () => void
  onGotoSchedule: () => void
  onGenerate: () => void
}

export function Dashboard({
  tournament,
  isOwner,
  onTimerMinutes,
  onBellVariant,
  onMatchScore,
  onGroupScore,
  onBracketScore,
  onGotoSetup,
  onGotoSchedule,
  onGenerate,
}: Props) {
  const { t } = useTranslation()
  const f = tournament.format

  // Empty state — no schedule generated yet
  const hasContent =
    (f === 'rotation' && tournament.schedule.length > 0) ||
    ((f === 'groups' || f === 'groups-ko') && tournament.groupSchedule.length > 0) ||
    ((f === 'knockout' || f === 'groups-ko') && tournament.bracket.length > 0)

  if (!hasContent) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon="🎾"
          title={t('dashboard.empty.title')}
          description={t('dashboard.empty.description')}
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              {f === 'rotation' && tournament.players.length >= 4 ? (
                <Button onClick={onGenerate} size="lg">
                  {t('dashboard.scheduleButton')}
                </Button>
              ) : (
                <Button onClick={onGotoSetup} size="lg">
                  {t('dashboard.empty.action')}
                </Button>
              )}
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <LiveHero
        tournament={tournament}
        onTimerMinutes={onTimerMinutes}
        onBellVariant={onBellVariant}
      />
      {f === 'rotation' && (
        <RotationDashboard
          tournament={tournament}
          isOwner={isOwner}
          onScore={onMatchScore}
          onGotoSchedule={onGotoSchedule}
        />
      )}
      {(f === 'groups' || f === 'groups-ko') && (
        <GroupsDashboard
          tournament={tournament}
          isOwner={isOwner}
          onScore={onGroupScore}
        />
      )}
      {(f === 'knockout' || f === 'groups-ko') && (
        <BracketDashboard
          tournament={tournament}
          isOwner={isOwner}
          onScore={onBracketScore}
        />
      )}
    </div>
  )
}

function LiveHero({
  tournament,
  onTimerMinutes,
  onBellVariant,
}: {
  tournament: Tournament
  onTimerMinutes: (n: number) => void
  onBellVariant: (v: BellVariant) => void
}) {
  const { t } = useTranslation()
  const { done, total } = computeProgress(tournament)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const currentRound = currentRoundIndex(tournament)

  return (
    <Card variant="hero" className="overflow-hidden">
      <div className="bg-court-pattern px-5 py-5 text-cream">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-cream/70 mb-1">
              {t('dashboard.title')}
            </div>
            {currentRound != null && tournament.format === 'rotation' && (
              <div className="serif text-2xl sm:text-3xl font-semibold">
                {t('dashboard.currentRound', {
                  n: currentRound,
                  total: tournament.schedule.length,
                })}
              </div>
            )}
            {tournament.format !== 'rotation' && (
              <div className="serif text-2xl sm:text-3xl font-semibold">
                {tournament.name || t('app.defaultName')}
              </div>
            )}
          </div>
          <Pill tone="live" className="text-[10px]">
            ● LIVE
          </Pill>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-baseline justify-between text-xs text-cream/85">
            <span className="uppercase tracking-wider font-semibold">
              {t('dashboard.allMatches')}
            </span>
            <span className="tabular font-medium">
              {t('dashboard.progress', { done, total })}
            </span>
          </div>
          <div className="h-2 rounded-full bg-cream/15 overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 border-t border-border">
        <RoundTimer
          minutes={tournament.timerMinutes}
          onMinutesChange={onTimerMinutes}
          bellVariant={tournament.bellVariant}
          onBellVariantChange={onBellVariant}
        />
      </div>
    </Card>
  )
}

function RotationDashboard({
  tournament,
  isOwner,
  onScore,
  onGotoSchedule,
}: {
  tournament: Tournament
  isOwner: boolean
  onScore: (
    roundIndex: number,
    court: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
  onGotoSchedule: () => void
}) {
  const { t } = useTranslation()
  const playerById = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p])),
    [tournament.players],
  )
  const round = currentRound(tournament.schedule)
  if (!round) {
    return (
      <Card variant="flat" className="p-6 text-center text-sm text-fg-muted">
        {t('dashboard.noResults')}
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="serif text-xl font-semibold">
          {t('schedule.round', { n: round.index })}
        </h2>
        <button
          type="button"
          onClick={onGotoSchedule}
          className="text-sm text-brand hover:underline font-medium"
        >
          {t('dashboard.viewAll')}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {round.matches.map((m: Match) => (
          <MatchCard
            key={m.court}
            court={m.court}
            teamAName={namesOf(m.teamA.players, playerById)}
            teamBName={namesOf(m.teamB.players, playerById)}
            scoreA={m.scoreA}
            scoreB={m.scoreB}
            readOnly={!isOwner}
            onChange={(a, b) => onScore(round.index, m.court, a, b)}
          />
        ))}
      </div>

      {round.resting.length > 0 && (
        <Card variant="flat" className="p-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle mb-2">
            {t('dashboard.resting')}
          </div>
          <div className="flex flex-wrap gap-2">
            {round.resting.map((id) => {
              const p = playerById.get(id)
              if (!p) return null
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-sm"
                >
                  <Avatar name={p.name} gender={p.gender} size="xs" />
                  {p.name}
                </span>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function GroupsDashboard({
  tournament,
  isOwner,
  onScore,
}: {
  tournament: Tournament
  isOwner: boolean
  onScore: (
    group: number,
    matchIndex: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
}) {
  const { t } = useTranslation()
  const entryById = useMemo(
    () => new Map(tournament.entries.map((e) => [e.id, e])),
    [tournament.entries],
  )

  // Open matches first
  const openMatches = tournament.groupSchedule.filter(
    (m: GroupMatch) => m.scoreA == null || m.scoreB == null,
  )
  if (openMatches.length === 0) {
    return (
      <Card variant="flat" className="p-6 text-center text-sm text-fg-muted">
        {t('dashboard.noResults')}
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      <h2 className="serif text-xl font-semibold">{t('tab.groups')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {openMatches.slice(0, 6).map((m: GroupMatch) => {
          const a = entryById.get(m.entryA)
          const b = entryById.get(m.entryB)
          return (
            <MatchCard
              key={`${m.group}-${m.matchIndex}`}
              eyebrow={t('ranking.groupHeading', {
                letter: groupLetter(m.group),
              })}
              teamAName={a?.name ?? '—'}
              teamBName={b?.name ?? '—'}
              scoreA={m.scoreA}
              scoreB={m.scoreB}
              readOnly={!isOwner}
              onChange={(sa, sb) => onScore(m.group, m.matchIndex, sa, sb)}
            />
          )
        })}
      </div>
    </div>
  )
}

function BracketDashboard({
  tournament,
  isOwner,
  onScore,
}: {
  tournament: Tournament
  isOwner: boolean
  onScore: (matchId: string, a: number | undefined, b: number | undefined) => void
}) {
  const { t } = useTranslation()
  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )

  const groupWinners = useMemo(() => {
    // For pure knockout this is irrelevant; for groups-ko we'd need standings.
    // Keep simple: no winner resolution from groups for the dashboard preview —
    // BracketPanel handles the authoritative view.
    return undefined
  }, [])

  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName, groupWinners),
    [tournament.bracket, entryName, groupWinners],
  )

  const openMatches = resolved.filter(
    (m) => m.scoreA == null || m.scoreB == null,
  )
  if (openMatches.length === 0) {
    return (
      <Card variant="flat" className="p-6 text-center text-sm text-fg-muted">
        {t('dashboard.noResults')}
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      <h2 className="serif text-xl font-semibold">{t('tab.bracket')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {openMatches.slice(0, 6).map((m) => (
          <MatchCard
            key={m.matchId}
            eyebrow={bracketRoundLabel(m, resolved, t)}
            teamAName={m.pendingA}
            teamBName={m.pendingB}
            scoreA={m.scoreA}
            scoreB={m.scoreB}
            readOnly={!isOwner}
            onChange={(a, b) => onScore(m.matchId, a, b)}
          />
        ))}
      </div>
    </div>
  )
}

// ---- helpers --------------------------------------------------------------

function computeProgress(t: Tournament): { done: number; total: number } {
  if (t.format === 'rotation') {
    const matches = t.schedule.flatMap((r) => r.matches)
    return {
      done: matches.filter((m) => m.scoreA != null && m.scoreB != null).length,
      total: matches.length,
    }
  }
  if (t.format === 'groups') {
    return {
      done: t.groupSchedule.filter((m) => m.scoreA != null && m.scoreB != null).length,
      total: t.groupSchedule.length,
    }
  }
  if (t.format === 'knockout') {
    return {
      done: t.bracket.filter((m) => m.scoreA != null && m.scoreB != null).length,
      total: t.bracket.length,
    }
  }
  // groups-ko: groups + bracket combined
  const g = t.groupSchedule.length
  const b = t.bracket.length
  return {
    done:
      t.groupSchedule.filter((m) => m.scoreA != null && m.scoreB != null).length +
      t.bracket.filter((m) => m.scoreA != null && m.scoreB != null).length,
    total: g + b,
  }
}

function currentRoundIndex(t: Tournament): number | null {
  if (t.format !== 'rotation') return null
  const r = currentRound(t.schedule)
  return r?.index ?? null
}

function currentRound(schedule: Round[]): Round | null {
  for (const r of schedule) {
    const allDone = r.matches.every((m) => m.scoreA != null && m.scoreB != null)
    if (!allDone) return r
  }
  return schedule[0] ?? null
}

function namesOf(ids: readonly string[], byId: Map<string, { name: string }>): string {
  return ids.map((id) => byId.get(id)?.name ?? '?').join(' & ')
}

function bracketRoundLabel(
  m: ResolvedBracketMatch,
  all: ResolvedBracketMatch[],
  t: (k: 'bracket.roundFinal' | 'bracket.roundSemi' | 'bracket.roundQuarter' | 'bracket.roundEighth') => string,
): string {
  const maxRound = all.reduce((acc, x) => Math.max(acc, x.round), 0)
  const r = m.round
  if (r === maxRound) return t('bracket.roundFinal')
  if (r === maxRound - 1) return t('bracket.roundSemi')
  if (r === maxRound - 2) return t('bracket.roundQuarter')
  if (r === maxRound - 3) return t('bracket.roundEighth')
  return `R${r}`
}
