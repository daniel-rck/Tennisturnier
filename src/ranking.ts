import type { Player, Round } from './types'
import type { ResolvedBracketMatch } from './knockoutScheduler'

export interface RotationRanking {
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

export function computeRotationRanking(
  schedule: Round[],
  players: Player[],
): RotationRanking[] {
  const stats = new Map<string, Omit<RotationRanking, 'rank' | 'diff'>>()
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

export interface KnockoutPodium {
  champion: string | null
  runnerUp: string | null
  /** Names of the third place(s). With a 3rd-place match this is the winner;
   *  otherwise both semifinal losers (alphabetically). */
  thirds: string[]
}

export function computeKnockoutPodium(
  resolved: ResolvedBracketMatch[],
  entryName: (id: string) => string,
): KnockoutPodium {
  if (resolved.length === 0) return { champion: null, runnerUp: null, thirds: [] }
  const final = resolved.find((m) => m.matchId === 'F') ?? resolved[resolved.length - 1]
  const thirdPlaceMatch = resolved.find((m) => m.matchId === '3P')
  const semis = resolved.filter((m) => m.round === final.round - 1)
  const champion = final.winner ? entryName(final.winner) : null
  const runnerUp = final.winner
    ? final.entryA === final.winner
      ? final.entryB
        ? entryName(final.entryB)
        : null
      : final.entryA
        ? entryName(final.entryA)
        : null
    : null
  const thirds: string[] = []
  if (thirdPlaceMatch?.winner) {
    thirds.push(entryName(thirdPlaceMatch.winner))
  } else {
    for (const sf of semis) {
      if (sf.winner == null || sf.entryA == null || sf.entryB == null) continue
      const loser = sf.winner === sf.entryA ? sf.entryB : sf.entryA
      thirds.push(entryName(loser))
    }
    thirds.sort((a, b) => a.localeCompare(b, 'de'))
  }
  return { champion, runnerUp, thirds }
}
