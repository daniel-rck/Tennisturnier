import { useCallback, useEffect, useMemo } from 'react'
import type { BracketMatch, Tournament } from '../types'
import {
  buildBracket,
  entrySlots,
  groupAdvanceSlots,
  resolveBracket,
} from '../knockoutScheduler'
import { assignGroups, groupStandings } from '../groupScheduler'

interface Props {
  tournament: Tournament
  onSetBracket: (bracket: BracketMatch[]) => void
  onScore: (
    matchId: string,
    a: number | undefined,
    b: number | undefined,
  ) => void
}

export function BracketPanel({ tournament, onSetBracket, onScore }: Props) {
  const groupWinners = useMemo(() => {
    if (tournament.format !== 'groups-ko') return undefined
    const { groups } = assignGroups(tournament.entries, tournament.groupCount)
    const map = new Map<string, string>()
    groups.forEach((g, gi) => {
      const standings = groupStandings(
        g,
        tournament.groupSchedule.filter((m) => m.group === gi + 1),
      )
      standings.forEach((s, ri) => {
        map.set(`${gi + 1}|${ri + 1}`, s.entryId)
      })
    })
    return (group: number, rank: number) => map.get(`${group}|${rank}`)
  }, [
    tournament.format,
    tournament.entries,
    tournament.groupCount,
    tournament.groupSchedule,
  ])

  const desired = useMemo(() => {
    if (tournament.format === 'knockout') {
      return buildBracket(entrySlots(tournament.entries.map((e) => e.id)))
    }
    if (tournament.format === 'groups-ko') {
      return buildBracket(
        groupAdvanceSlots(tournament.groupCount, tournament.advancePerGroup),
      )
    }
    return []
  }, [
    tournament.format,
    tournament.entries,
    tournament.groupCount,
    tournament.advancePerGroup,
  ])

  // Sync bracket structure when entry / format / advancePerGroup changes
  useEffect(() => {
    const sameStructure =
      tournament.bracket.length === desired.length &&
      desired.every((d, i) => {
        const cur = tournament.bracket[i]
        return (
          cur &&
          cur.matchId === d.matchId &&
          cur.round === d.round &&
          cur.position === d.position &&
          slotEq(cur.slotA, d.slotA) &&
          slotEq(cur.slotB, d.slotB)
        )
      })
    if (!sameStructure) {
      const scoreMap = new Map<string, { a?: number; b?: number }>()
      for (const m of tournament.bracket)
        scoreMap.set(m.matchId, { a: m.scoreA, b: m.scoreB })
      const merged = desired.map((d) => {
        const s = scoreMap.get(d.matchId)
        return { ...d, scoreA: s?.a, scoreB: s?.b }
      })
      onSetBracket(merged)
    }
  }, [desired, tournament.bracket, onSetBracket])

  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )

  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName, groupWinners),
    [tournament.bracket, entryName, groupWinners],
  )

  if (
    tournament.format === 'knockout' &&
    tournament.entries.length < 2
  ) {
    return (
      <p className="text-slate-500 text-sm italic">
        Lege zuerst Teilnehmer:innen auf der Teams-Seite an (mindestens 2).
      </p>
    )
  }
  if (tournament.format === 'groups-ko' && tournament.entries.length < 2) {
    return (
      <p className="text-slate-500 text-sm italic">
        Lege zuerst Teilnehmer:innen auf der Teams-Seite an.
      </p>
    )
  }

  // Group resolved matches by round
  const rounds = new Map<number, typeof resolved>()
  for (const m of resolved) {
    if (!rounds.has(m.round)) rounds.set(m.round, [])
    rounds.get(m.round)!.push(m)
  }
  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b)
  const lastRound = roundNumbers[roundNumbers.length - 1]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          {resolved.length} Matches im Bracket
          {resolved.some((m) => m.isByeMatch) &&
            ` (inkl. ${resolved.filter((m) => m.isByeMatch).length} Freilos${resolved.filter((m) => m.isByeMatch).length === 1 ? '' : 'e'})`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-fit pb-2">
          {roundNumbers.map((rn) => {
            const matches = rounds.get(rn)!
            return (
              <div key={rn} className="min-w-[16rem]">
                <h3 className="text-sm font-semibold mb-2 text-slate-600">
                  {roundLabel(rn, lastRound, matches.length)}
                </h3>
                <div className="space-y-2">
                  {matches.map((m) => (
                    <BracketCard
                      key={m.matchId}
                      m={m}
                      onScore={onScore}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function roundLabel(round: number, last: number, matchCount: number) {
  if (round === last) return 'Finale'
  if (round === last - 1) return 'Halbfinale'
  if (round === last - 2) return 'Viertelfinale'
  if (round === last - 3) return 'Achtelfinale'
  return `Runde ${round} (${matchCount} Matches)`
}

function BracketCard({
  m,
  onScore,
}: {
  m: ReturnType<typeof resolveBracket>[number]
  onScore: Props['onScore']
}) {
  const parse = (v: string): number | undefined => {
    if (v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
  }
  const aWinning = m.winner != null && m.winner === m.entryA
  const bWinning = m.winner != null && m.winner === m.entryB

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 text-sm">
      <div className="text-xs text-slate-500 mb-1">
        {m.matchId}
        {m.isByeMatch && ' · Freilos'}
      </div>
      <SlotRow
        label={m.pendingA}
        score={m.scoreA}
        editable={!m.isByeMatch && m.entryA != null && m.entryB != null}
        winning={aWinning}
        onChange={(v) => onScore(m.matchId, parse(v), m.scoreB)}
      />
      <SlotRow
        label={m.pendingB}
        score={m.scoreB}
        editable={!m.isByeMatch && m.entryA != null && m.entryB != null}
        winning={bWinning}
        onChange={(v) => onScore(m.matchId, m.scoreA, parse(v))}
      />
    </div>
  )
}

function SlotRow({
  label,
  score,
  editable,
  winning,
  onChange,
}: {
  label: string
  score?: number
  editable: boolean
  winning: boolean
  onChange: (v: string) => void
}) {
  return (
    <div
      className={
        'flex items-center justify-between gap-2 px-2 py-1 rounded ' +
        (winning ? 'bg-emerald-50 font-semibold' : '')
      }
    >
      <span className="truncate">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        placeholder={editable ? '–' : ''}
        value={score ?? ''}
        disabled={!editable}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
  )
}

function slotEq(a: BracketMatch['slotA'], b: BracketMatch['slotA']): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'entry' && b.kind === 'entry') return a.entryId === b.entryId
  if (a.kind === 'feeder' && b.kind === 'feeder') return a.matchId === b.matchId
  if (a.kind === 'group-rank' && b.kind === 'group-rank')
    return a.group === b.group && a.rank === b.rank
  return true
}
