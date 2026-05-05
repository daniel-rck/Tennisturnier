import { useMemo } from 'react'
import type { BellVariant, Match, Player, Round, Tournament } from '../types'
import { MODE_LABELS } from '../types'
import { RoundTimer } from './RoundTimer'
import { ScoreInput } from './ScoreInput'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

interface Props {
  tournament: Tournament
  onGenerate: () => void
  onTimerMinutes: (n: number) => void
  onBellVariant: (v: BellVariant) => void
  onScore: (
    roundIndex: number,
    court: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
  warnings: string[]
  isGenerating?: boolean
}

export function SchedulePanel({
  tournament,
  onGenerate,
  onTimerMinutes,
  onBellVariant,
  onScore,
  warnings,
  isGenerating = false,
}: Props) {
  const playerById = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p])),
    [tournament.players],
  )

  const stats = useMemo(
    () => computeStats(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  )

  return (
    <div className="space-y-4">
      <RoundTimer
        minutes={tournament.timerMinutes}
        onMinutesChange={onTimerMinutes}
        bellVariant={tournament.bellVariant}
        onBellVariantChange={onBellVariant}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={tournament.players.length < 4 || isGenerating}
          className="btn-primary"
        >
          {isGenerating && <Spinner />}
          {isGenerating ? 'Generiere…' : 'Spielplan generieren'}
        </button>
        <div className="text-sm text-fg-muted">
          Modus: <strong>{MODE_LABELS[tournament.mode]}</strong> ·{' '}
          {tournament.courts} Plätze · {tournament.rounds} Runden
        </div>
      </div>

      {tournament.players.length < 4 && (
        <div
          role="status"
          className="rounded-md bg-warn-bg border border-warn-bg px-3 py-2 text-sm text-warn-fg"
        >
          Mindestens 4 Spieler:innen werden benötigt.
        </div>
      )}

      {warnings.length > 0 && (
        <ul role="status" aria-live="polite" className="space-y-1">
          {warnings.map((w, i) => (
            <li
              key={i}
              className="rounded-md bg-warn-bg border border-warn-bg px-3 py-2 text-sm text-warn-fg"
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      {tournament.schedule.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Noch kein Spielplan generiert"
          description={
            tournament.players.length < 4
              ? 'Lege erst mindestens 4 Spieler:innen an.'
              : 'Klicke auf „Spielplan generieren", um zu starten.'
          }
          action={
            tournament.players.length >= 4 && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="btn-primary"
              >
                {isGenerating && <Spinner />}
                {isGenerating ? 'Generiere…' : 'Spielplan generieren'}
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-3">
            {tournament.schedule.map((round) => (
              <RoundCard
                key={round.index}
                round={round}
                byId={playerById}
                expectedCourts={tournament.courts}
                onScore={onScore}
              />
            ))}
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-fg-muted hover:text-fg">
              Statistik (Einsätze / Pausen pro Spieler:in)
            </summary>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-fg-muted">
                  <th className="py-1">Name</th>
                  <th className="py-1">Spiele</th>
                  <th className="py-1">Pausen</th>
                  <th className="py-1">Verschiedene Partner</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-1">{s.name}</td>
                    <td className="py-1">{s.plays}</td>
                    <td className="py-1">{s.rests}</td>
                    <td className="py-1">{s.uniquePartners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}

function RoundCard({
  round,
  byId,
  expectedCourts,
  onScore,
}: {
  round: Round
  byId: Map<string, Player>
  expectedCourts: number
  onScore: Props['onScore']
}) {
  const isPartial = round.matches.length < expectedCourts
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Runde {round.index}</h3>
          {isPartial && (
            <span className="rounded-full bg-warn-bg text-warn-fg text-[10px] uppercase tracking-wide font-medium px-2 py-0.5">
              Teilrunde
            </span>
          )}
        </div>
        {round.resting.length > 0 && (
          <span className="text-xs text-fg-muted">
            Pause: {round.resting.map((id) => byId.get(id)?.name).join(', ')}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {round.matches.map((m) => (
          <MatchCard
            key={m.court}
            match={m}
            byId={byId}
            onScore={(a, b) => onScore(round.index, m.court, a, b)}
          />
        ))}
      </div>
    </div>
  )
}

function MatchCard({
  match,
  byId,
  onScore,
}: {
  match: Match
  byId: Map<string, Player>
  onScore: (a: number | undefined, b: number | undefined) => void
}) {
  const teamAName = match.teamA.players.map((id) => byId.get(id)?.name).join(' & ')
  const teamBName = match.teamB.players.map((id) => byId.get(id)?.name).join(' & ')
  const hasA = match.scoreA != null
  const hasB = match.scoreB != null
  const status: 'pending' | 'partial' | 'complete' =
    hasA && hasB ? 'complete' : hasA || hasB ? 'partial' : 'pending'
  const accent =
    status === 'complete'
      ? 'border-l-4 border-l-brand'
      : status === 'partial'
        ? 'border-l-4 border-l-warn-fg'
        : ''
  return (
    <div
      className={
        'rounded-md border border-border bg-surface-muted px-3 py-2 text-sm ' +
        accent
      }
    >
      <div className="flex items-center justify-between mb-1 text-xs font-medium">
        <span className="text-fg-muted">Platz {match.court}</span>
        {status === 'complete' && (
          <span className="rounded-full bg-brand-soft text-brand-soft-fg px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Erfasst
          </span>
        )}
        {status === 'partial' && (
          <span className="rounded-full bg-warn-bg text-warn-fg px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Unvollständig
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="truncate" title={teamAName}>
          {teamAName}
        </span>
        <span className="text-fg-subtle text-xs">vs.</span>
        <span className="truncate text-right" title={teamBName}>
          {teamBName}
        </span>
        <div className="justify-self-start">
          <ScoreInput
            value={match.scoreA}
            onChange={(a) => onScore(a, match.scoreB)}
            ariaLabel={`Spiele ${teamAName}`}
          />
        </div>
        <span className="text-fg-subtle text-xs text-center">:</span>
        <div className="justify-self-end">
          <ScoreInput
            value={match.scoreB}
            onChange={(b) => onScore(match.scoreA, b)}
            ariaLabel={`Spiele ${teamBName}`}
          />
        </div>
      </div>
    </div>
  )
}

interface Stat {
  id: string
  name: string
  plays: number
  rests: number
  uniquePartners: number
}

function computeStats(schedule: Round[], players: Player[]): Stat[] {
  const map = new Map<string, Stat & { partners: Set<string> }>()
  for (const p of players)
    map.set(p.id, {
      id: p.id,
      name: p.name,
      plays: 0,
      rests: 0,
      uniquePartners: 0,
      partners: new Set(),
    })
  for (const r of schedule) {
    for (const m of r.matches) {
      for (const team of [m.teamA.players, m.teamB.players]) {
        for (const id of team) {
          const s = map.get(id)
          if (!s) continue
          s.plays++
          for (const other of team) if (other !== id) s.partners.add(other)
        }
      }
    }
    for (const id of r.resting) {
      const s = map.get(id)
      if (s) s.rests++
    }
  }
  return Array.from(map.values()).map((s) => ({
    id: s.id,
    name: s.name,
    plays: s.plays,
    rests: s.rests,
    uniquePartners: s.partners.size,
  }))
}
