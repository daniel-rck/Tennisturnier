import { useCallback, useMemo } from 'react'
import type {
  Entry,
  RevealCategory,
  RevealStep,
  Tournament,
} from '../types'
import {
  assignGroups,
  groupStandings,
  resolveGroupAssignment,
} from '../groupScheduler'
import { groupLetter, resolveBracket } from '../knockoutScheduler'
import { computeKnockoutPodium, computeRotationRanking } from '../ranking'
import type { RotationRanking } from '../ranking'
import { RevealPanel } from './RevealPanel'

function groupsFor(t: Tournament): Entry[][] {
  if (t.groupAssignment.length === t.groupCount) {
    return resolveGroupAssignment(t.entries, t.groupAssignment)
  }
  return assignGroups(t.entries, t.groupCount).groups
}

interface Props {
  tournament: Tournament
  isOwner?: boolean
  onSetRevealActive?: (b: boolean) => void
  onSetRevealStep?: (cat: RevealCategory, step: RevealStep) => void
  onResetReveal?: () => void
}

export function RankingPanel({
  tournament,
  isOwner = true,
  onSetRevealActive,
  onSetRevealStep,
  onResetReveal,
}: Props) {
  const f = tournament.format

  if (tournament.reveal.active && onSetRevealActive && onSetRevealStep && onResetReveal) {
    return (
      <RevealPanel
        tournament={tournament}
        isOwner={isOwner}
        onStep={onSetRevealStep}
        onReset={onResetReveal}
        onClose={() => onSetRevealActive(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {f === 'rotation' && isOwner && onSetRevealActive && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSetRevealActive(true)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-emerald-700"
          >
            🎉 Siegerehrung-Show starten
          </button>
        </div>
      )}
      {f === 'rotation' && <RotationRanking tournament={tournament} />}
      {f === 'groups' && <GroupsRanking tournament={tournament} />}
      {f === 'knockout' && <KnockoutRanking tournament={tournament} />}
      {f === 'groups-ko' && <GroupsKoRanking tournament={tournament} />}
    </div>
  )
}

// ========== Rotation =====================================================

type RotationRow = RotationRanking

function RotationRanking({ tournament }: Props) {
  const rows = useMemo(
    () => computeRotationRanking(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  )
  const completed = tournament.schedule.flatMap((r) => r.matches).filter(
    (m) => m.scoreA != null && m.scoreB != null,
  ).length
  const total = tournament.schedule.flatMap((r) => r.matches).length

  const showPerGender =
    tournament.mode === 'mixed' && tournament.perGenderRanking
  const playerGender = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p.gender])),
    [tournament.players],
  )
  const womenRows = useMemo(
    () =>
      showPerGender ? rerank(rows.filter((r) => playerGender.get(r.id) === 'F')) : [],
    [rows, playerGender, showPerGender],
  )
  const menRows = useMemo(
    () =>
      showPerGender ? rerank(rows.filter((r) => playerGender.get(r.id) === 'M')) : [],
    [rows, playerGender, showPerGender],
  )

  if (tournament.schedule.length === 0)
    return (
      <p className="text-slate-500 text-sm italic">
        Noch kein Spielplan generiert.
      </p>
    )
  if (completed === 0)
    return (
      <p className="text-slate-500 text-sm italic">
        Noch keine Ergebnisse eingetragen.
      </p>
    )

  const podium = rows.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        {completed} von {total} Matches erfasst
        {completed < total && ' — Tabelle aktualisiert sich live.'}
      </div>
      <section className="space-y-4">
        {showPerGender && (
          <h3 className="text-base font-semibold text-slate-800">
            Gesamtwertung
          </h3>
        )}
        {podium.length >= 3 && <Podium podium={podium.map(rowToPodium)} />}
        <RankingTable rows={rows.map(rowToTableRow)} />
      </section>
      {showPerGender && (
        <GenderRanking title="Damen" rows={womenRows} />
      )}
      {showPerGender && (
        <GenderRanking title="Herren" rows={menRows} />
      )}
    </div>
  )
}

function GenderRanking({
  title,
  rows,
}: {
  title: string
  rows: RotationRow[]
}) {
  if (rows.length === 0) return null
  const podium = rows.slice(0, 3)
  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {podium.length >= 3 && <Podium podium={podium.map(rowToPodium)} />}
      <RankingTable rows={rows.map(rowToTableRow)} />
    </section>
  )
}

function rowToTableRow(r: RotationRow): TableRow {
  return {
    rank: r.rank,
    name: r.name,
    played: r.played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    for: r.gamesFor,
    against: r.gamesAgainst,
    diff: r.diff,
  }
}

function rerank(rows: RotationRow[]): RotationRow[] {
  const next = rows.map((r) => ({ ...r }))
  let i = 0
  while (i < next.length) {
    let j = i + 1
    while (
      j < next.length &&
      next[j].wins === next[i].wins &&
      next[j].diff === next[i].diff &&
      next[j].gamesFor === next[i].gamesFor
    )
      j++
    for (let k = i; k < j; k++) next[k].rank = i + 1
    i = j
  }
  return next
}

// ========== Groups =======================================================

function GroupsRanking({ tournament }: Props) {
  const groups = useMemo(() => groupsFor(tournament), [tournament])
  if (tournament.entries.length === 0)
    return (
      <p className="text-slate-500 text-sm italic">
        Noch keine Teilnehmer:innen angelegt.
      </p>
    )

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Tabelle pro Gruppe — sortiert nach Siegen, dann Spielesaldo, dann
        gewonnenen Spielen.
      </p>
      {groups.map((group, gi) => {
        const groupNum = gi + 1
        const matches = tournament.groupSchedule.filter(
          (m) => m.group === groupNum,
        )
        const standings = groupStandings(group, matches)
        return (
          <div
            key={gi}
            className="rounded-md border border-slate-200 bg-white p-3"
          >
            <h3 className="font-semibold mb-2">
              Gruppe {groupLetter(groupNum)}
            </h3>
            <RankingTable
              rows={standings.map((s) => ({
                rank: s.rank,
                name: s.name,
                played: s.played,
                wins: s.wins,
                draws: s.draws,
                losses: s.losses,
                for: s.gamesFor,
                against: s.gamesAgainst,
                diff: s.diff,
              }))}
            />
          </div>
        )
      })}
    </div>
  )
}

// ========== Knockout =====================================================

function KnockoutRanking({ tournament }: Props) {
  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )
  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName),
    [tournament.bracket, entryName],
  )
  return <BracketSummary resolved={resolved} entryName={entryName} />
}

// ========== Groups + KO ==================================================

function GroupsKoRanking({ tournament }: Props) {
  const groups = useMemo(() => groupsFor(tournament), [tournament])
  const groupWinnerMap = useMemo(() => {
    const map = new Map<string, string>()
    groups.forEach((g, gi) => {
      const standings = groupStandings(
        g,
        tournament.groupSchedule.filter((m) => m.group === gi + 1),
      )
      standings.forEach((s, ri) =>
        map.set(`${gi + 1}|${ri + 1}`, s.entryId),
      )
    })
    return map
  }, [groups, tournament.groupSchedule])

  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )
  const resolved = useMemo(
    () =>
      resolveBracket(tournament.bracket, entryName, (g, r) =>
        groupWinnerMap.get(`${g}|${r}`),
      ),
    [tournament.bracket, entryName, groupWinnerMap],
  )
  return (
    <div className="space-y-6">
      <BracketSummary resolved={resolved} entryName={entryName} />
      <details>
        <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
          Gruppenphase-Tabellen
        </summary>
        <div className="mt-3 space-y-3">
          {groups.map((group, gi) => {
            const groupNum = gi + 1
            const matches = tournament.groupSchedule.filter(
              (m) => m.group === groupNum,
            )
            const standings = groupStandings(group, matches)
            return (
              <div
                key={gi}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <h3 className="font-semibold mb-2">
                  Gruppe {groupLetter(groupNum)}
                </h3>
                <RankingTable
                  rows={standings.map((s) => ({
                    rank: s.rank,
                    name: s.name,
                    played: s.played,
                    wins: s.wins,
                    draws: s.draws,
                    losses: s.losses,
                    for: s.gamesFor,
                    against: s.gamesAgainst,
                    diff: s.diff,
                  }))}
                />
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

// ========== Shared =======================================================

function BracketSummary({
  resolved,
  entryName,
}: {
  resolved: ReturnType<typeof resolveBracket>
  entryName: (id: string) => string
}) {
  if (resolved.length === 0)
    return (
      <p className="text-slate-500 text-sm italic">
        Noch kein Bracket erzeugt.
      </p>
    )
  const { champion, runnerUp, thirds } = computeKnockoutPodium(resolved, entryName)

  return (
    <div className="space-y-4">
      {champion ? (
        <div className="rounded-md bg-emerald-50 border border-emerald-300 p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
            Sieger
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {champion}
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic">
          Finale noch nicht entschieden.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="text-xs text-slate-500 mb-1">🥈 Finalist:in</div>
          <div className="font-semibold">{runnerUp ?? '—'}</div>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <div className="text-xs text-slate-500 mb-1">
            🥉 Halbfinal-Verlierer
          </div>
          <div className="font-semibold">
            {thirds.length > 0 ? thirds.join(', ') : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PodiumRow {
  name: string
  wins: number
  diff: number
}

function rowToPodium(r: RotationRow): PodiumRow {
  return { name: r.name, wins: r.wins, diff: r.diff }
}

function Podium({ podium }: { podium: PodiumRow[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <PodiumStep row={podium[1]} place={2} height="h-24" tone="bg-slate-300" />
      <PodiumStep row={podium[0]} place={1} height="h-32" tone="bg-amber-300" />
      <PodiumStep row={podium[2]} place={3} height="h-20" tone="bg-orange-300" />
    </div>
  )
}

function PodiumStep({
  row,
  place,
  height,
  tone,
}: {
  row: PodiumRow
  place: number
  height: string
  tone: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl">{medal(place)}</div>
      <div className="font-semibold text-center text-sm">{row.name}</div>
      <div className="text-xs text-slate-500">
        {row.wins} S · {row.diff > 0 ? '+' : ''}
        {row.diff}
      </div>
      <div
        className={`w-full ${height} ${tone} rounded-t-md flex items-center justify-center font-bold text-slate-800`}
      >
        {place}
      </div>
    </div>
  )
}

function medal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

interface TableRow {
  rank: number
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  for: number
  against: number
  diff: number
}

function RankingTable({ rows }: { rows: TableRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-700 text-left">
            <th className="px-2 py-2 w-10">#</th>
            <th className="px-2 py-2">Name</th>
            <th className="px-2 py-2 text-right">Sp</th>
            <th className="px-2 py-2 text-right">S</th>
            <th className="px-2 py-2 text-right">U</th>
            <th className="px-2 py-2 text-right">N</th>
            <th className="px-2 py-2 text-right">Spiele +/–</th>
            <th className="px-2 py-2 text-right">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-2 py-1.5 font-semibold">
                {medal(r.rank)} {r.rank}.
              </td>
              <td className="px-2 py-1.5">{r.name}</td>
              <td className="px-2 py-1.5 text-right">{r.played}</td>
              <td className="px-2 py-1.5 text-right text-emerald-700">
                {r.wins}
              </td>
              <td className="px-2 py-1.5 text-right text-slate-500">
                {r.draws}
              </td>
              <td className="px-2 py-1.5 text-right text-rose-700">
                {r.losses}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {r.for}:{r.against}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                {r.diff > 0 ? '+' : ''}
                {r.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

