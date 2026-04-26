import { useMemo } from 'react'
import type { Player, Round, Tournament } from '../types'

interface Props {
  tournament: Tournament
}

interface Row {
  id: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  gamesFor: number
  gamesAgainst: number
  diff: number
  rank: number
}

export function RankingPanel({ tournament }: Props) {
  const rows = useMemo(
    () => computeRanking(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  )

  const completed = tournament.schedule.flatMap((r) => r.matches).filter(
    (m) => m.scoreA != null && m.scoreB != null,
  ).length
  const total = tournament.schedule.flatMap((r) => r.matches).length

  const podium = rows.slice(0, 3)

  if (tournament.schedule.length === 0) {
    return (
      <p className="text-slate-500 text-sm italic">
        Noch kein Spielplan generiert — zuerst auf der Spielplan-Seite Runden
        erzeugen und Ergebnisse eintragen.
      </p>
    )
  }

  if (completed === 0) {
    return (
      <p className="text-slate-500 text-sm italic">
        Noch keine Ergebnisse eingetragen. Trage auf der Spielplan-Seite die
        gewonnenen Spiele pro Match ein, dann erscheint hier die Wertung.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-600">
        {completed} von {total} Matches erfasst
        {completed < total && ' — Tabelle aktualisiert sich live.'}
      </div>

      {podium.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 items-end">
          <PodiumStep row={podium[1]} place={2} height="h-24" tone="bg-slate-300" />
          <PodiumStep row={podium[0]} place={1} height="h-32" tone="bg-amber-300" />
          <PodiumStep row={podium[2]} place={3} height="h-20" tone="bg-orange-300" />
        </div>
      )}

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
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
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
                  {r.gamesFor}:{r.gamesAgainst}
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

      <p className="text-xs text-slate-500">
        Sortierung: Siege → Spielesaldo (Diff) → gewonnene Spiele → Name. Bei
        Pausenrunden zählt nur, wer tatsächlich gespielt hat.
      </p>
    </div>
  )
}

function PodiumStep({
  row,
  place,
  height,
  tone,
}: {
  row: Row
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

function computeRanking(schedule: Round[], players: Player[]): Row[] {
  const stats = new Map<
    string,
    Omit<Row, 'rank' | 'diff'>
  >()
  for (const p of players)
    stats.set(p.id, {
      id: p.id,
      name: p.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
    })

  for (const round of schedule) {
    for (const m of round.matches) {
      if (m.scoreA == null || m.scoreB == null) continue
      const aWin = m.scoreA > m.scoreB
      const bWin = m.scoreB > m.scoreA
      const draw = m.scoreA === m.scoreB
      for (const id of m.teamA.players) {
        const s = stats.get(id)
        if (!s) continue
        s.played++
        s.gamesFor += m.scoreA
        s.gamesAgainst += m.scoreB
        if (aWin) s.wins++
        else if (draw) s.draws++
        else if (bWin) s.losses++
      }
      for (const id of m.teamB.players) {
        const s = stats.get(id)
        if (!s) continue
        s.played++
        s.gamesFor += m.scoreB
        s.gamesAgainst += m.scoreA
        if (bWin) s.wins++
        else if (draw) s.draws++
        else if (aWin) s.losses++
      }
    }
  }

  const rows = Array.from(stats.values())
    .filter((s) => s.played > 0)
    .map((s) => ({ ...s, diff: s.gamesFor - s.gamesAgainst, rank: 0 }))
    .sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.diff !== b.diff) return b.diff - a.diff
      if (a.gamesFor !== b.gamesFor) return b.gamesFor - a.gamesFor
      return a.name.localeCompare(b.name, 'de')
    })

  // Rank with ties: same key → same rank, next rank skips by group size
  let i = 0
  while (i < rows.length) {
    let j = i + 1
    while (
      j < rows.length &&
      rows[j].wins === rows[i].wins &&
      rows[j].diff === rows[i].diff &&
      rows[j].gamesFor === rows[i].gamesFor
    )
      j++
    for (let k = i; k < j; k++) rows[k].rank = i + 1
    i = j
  }
  return rows
}
