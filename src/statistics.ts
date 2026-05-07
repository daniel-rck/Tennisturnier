import type { Tournament } from './types'

export interface BestPartnerOrOpponent {
  id: string
  name: string
  wins: number
  played: number
}

export interface PlayerStat {
  playerId: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  winRate: number
  gamesFor: number
  gamesAgainst: number
  diff: number
  bestPartner?: BestPartnerOrOpponent
  bestOpponent?: BestPartnerOrOpponent
}

interface MutableAgg {
  playerId: string
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  gamesFor: number
  gamesAgainst: number
  partners: Map<string, { wins: number; played: number }>
  opponents: Map<string, { wins: number; played: number }>
}

type Outcome = 'A' | 'B' | 'draw'

function outcome(scoreA: number, scoreB: number): Outcome {
  if (scoreA > scoreB) return 'A'
  if (scoreB > scoreA) return 'B'
  return 'draw'
}

function ensure(
  map: Map<string, MutableAgg>,
  id: string,
  name: string,
): MutableAgg {
  let agg = map.get(id)
  if (!agg) {
    agg = {
      playerId: id,
      name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      partners: new Map(),
      opponents: new Map(),
    }
    map.set(id, agg)
  }
  return agg
}

function bumpRel(
  rel: Map<string, { wins: number; played: number }>,
  id: string,
  win: boolean,
): void {
  const cur = rel.get(id) ?? { wins: 0, played: 0 }
  cur.played++
  if (win) cur.wins++
  rel.set(id, cur)
}

function recordMatch(
  aggs: Map<string, MutableAgg>,
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
  nameOf: (id: string) => string,
): void {
  const out = outcome(scoreA, scoreB)
  for (const id of teamA) {
    const agg = ensure(aggs, id, nameOf(id))
    agg.played++
    agg.gamesFor += scoreA
    agg.gamesAgainst += scoreB
    if (out === 'A') agg.wins++
    else if (out === 'B') agg.losses++
    else agg.draws++
    const aWon = out === 'A'
    for (const partner of teamA) if (partner !== id) bumpRel(agg.partners, partner, aWon)
    for (const opp of teamB) bumpRel(agg.opponents, opp, aWon)
  }
  for (const id of teamB) {
    const agg = ensure(aggs, id, nameOf(id))
    agg.played++
    agg.gamesFor += scoreB
    agg.gamesAgainst += scoreA
    if (out === 'B') agg.wins++
    else if (out === 'A') agg.losses++
    else agg.draws++
    const bWon = out === 'B'
    for (const partner of teamB) if (partner !== id) bumpRel(agg.partners, partner, bWon)
    for (const opp of teamA) bumpRel(agg.opponents, opp, bWon)
  }
}

function pickBest(
  rel: Map<string, { wins: number; played: number }>,
  nameOf: (id: string) => string,
): BestPartnerOrOpponent | undefined {
  let best: BestPartnerOrOpponent | undefined
  for (const [id, v] of rel) {
    if (v.wins === 0 && v.played === 0) continue
    const candidate: BestPartnerOrOpponent = {
      id,
      name: nameOf(id),
      wins: v.wins,
      played: v.played,
    }
    if (
      !best ||
      candidate.wins > best.wins ||
      (candidate.wins === best.wins && candidate.played > best.played) ||
      (candidate.wins === best.wins &&
        candidate.played === best.played &&
        candidate.name.localeCompare(best.name, 'de') < 0)
    ) {
      best = candidate
    }
  }
  return best
}

export function computePlayerStats(t: Tournament): PlayerStat[] {
  const aggs = new Map<string, MutableAgg>()
  const playerNames = new Map(t.players.map((p) => [p.id, p.name]))
  const nameOfPlayer = (id: string) => playerNames.get(id) ?? id

  for (const round of t.schedule) {
    for (const m of round.matches) {
      if (m.scoreA == null || m.scoreB == null) continue
      recordMatch(
        aggs,
        m.teamA.players,
        m.teamB.players,
        m.scoreA,
        m.scoreB,
        nameOfPlayer,
      )
    }
  }

  const entryMembers = new Map(t.entries.map((e) => [e.id, e.members]))
  const playerKeys = new Map<string, { id: string; name: string }>()
  for (const e of t.entries) {
    for (const member of e.members) {
      const trimmed = member.trim()
      if (!trimmed) continue
      const key = `entry:${trimmed.toLowerCase()}`
      if (!playerKeys.has(key))
        playerKeys.set(key, { id: key, name: trimmed })
    }
  }
  const nameOfEntryMember = (id: string) =>
    playerKeys.get(id)?.name ?? id.replace(/^entry:/, '')

  const expandEntry = (entryId: string): string[] => {
    const members = entryMembers.get(entryId)
    if (!members || members.length === 0) return []
    return members
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map((n) => `entry:${n.toLowerCase()}`)
  }

  for (const m of t.groupSchedule) {
    if (m.scoreA == null || m.scoreB == null) continue
    const teamA = expandEntry(m.entryA)
    const teamB = expandEntry(m.entryB)
    if (teamA.length === 0 || teamB.length === 0) continue
    recordMatch(aggs, teamA, teamB, m.scoreA, m.scoreB, nameOfEntryMember)
  }

  for (const m of t.bracket) {
    if (m.scoreA == null || m.scoreB == null) continue
    const slotEntry = (slot: typeof m.slotA): string | null =>
      slot.kind === 'entry' ? slot.entryId : null
    const aId = slotEntry(m.slotA)
    const bId = slotEntry(m.slotB)
    if (!aId || !bId) continue
    const teamA = expandEntry(aId)
    const teamB = expandEntry(bId)
    if (teamA.length === 0 || teamB.length === 0) continue
    recordMatch(aggs, teamA, teamB, m.scoreA, m.scoreB, nameOfEntryMember)
  }

  const results: PlayerStat[] = []
  for (const agg of aggs.values()) {
    if (agg.played === 0) continue
    const winRate = agg.wins / agg.played
    const partnerNameOf = (id: string) =>
      playerNames.get(id) ?? playerKeys.get(id)?.name ?? id
    results.push({
      playerId: agg.playerId,
      name: agg.name,
      played: agg.played,
      wins: agg.wins,
      draws: agg.draws,
      losses: agg.losses,
      winRate,
      gamesFor: agg.gamesFor,
      gamesAgainst: agg.gamesAgainst,
      diff: agg.gamesFor - agg.gamesAgainst,
      bestPartner: pickBest(agg.partners, partnerNameOf),
      bestOpponent: pickBest(agg.opponents, partnerNameOf),
    })
  }

  results.sort((a, b) => {
    if (a.winRate !== b.winRate) return b.winRate - a.winRate
    if (a.diff !== b.diff) return b.diff - a.diff
    if (a.wins !== b.wins) return b.wins - a.wins
    return a.name.localeCompare(b.name, 'de')
  })

  return results
}
