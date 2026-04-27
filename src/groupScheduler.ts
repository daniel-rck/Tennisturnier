import type { Entry, GroupMatch } from './types'

export interface GroupAssignment {
  groups: Entry[][]
  warnings: string[]
}

/** Distribute entries into N groups using a snake/round-robin allocation
 *  so seed strength is balanced (1 -> A, 2 -> B, 3 -> B, 4 -> A, ...). */
export function assignGroups(
  entries: Entry[],
  groupCount: number,
): GroupAssignment {
  const warnings: string[] = []
  const n = entries.length
  if (n < groupCount * 2) {
    warnings.push(
      `Pro Gruppe sollten mindestens 2 Teams sein. Mit ${n} Teilnehmern in ${groupCount} Gruppen wird eine Gruppe leer oder zu klein.`,
    )
  }
  const groups: Entry[][] = Array.from({ length: groupCount }, () => [])
  for (let i = 0; i < n; i++) {
    const cycle = Math.floor(i / groupCount)
    const idxInCycle = i % groupCount
    const g = cycle % 2 === 0 ? idxInCycle : groupCount - 1 - idxInCycle
    groups[g].push(entries[i])
  }
  return { groups, warnings }
}

/** Resolve a persisted assignment (entry IDs per group) into Entry[][]. */
export function resolveGroupAssignment(
  entries: Entry[],
  assignment: string[][],
): Entry[][] {
  const byId = new Map(entries.map((e) => [e.id, e]))
  return assignment.map((g) =>
    g.map((id) => byId.get(id)).filter((e): e is Entry => e !== undefined),
  )
}

/** Round-robin matches within a single group using the circle method. */
export function roundRobin(group: Entry[], groupNumber: number): GroupMatch[] {
  const matches: GroupMatch[] = []
  let counter = 1
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      matches.push({
        group: groupNumber,
        matchIndex: counter++,
        entryA: group[i].id,
        entryB: group[j].id,
      })
    }
  }
  return matches
}

export function buildGroupSchedule(
  entries: Entry[],
  groupCount: number,
): { schedule: GroupMatch[]; groups: Entry[][]; warnings: string[] } {
  const { groups, warnings } = assignGroups(entries, groupCount)
  const schedule: GroupMatch[] = []
  groups.forEach((g, idx) => schedule.push(...roundRobin(g, idx + 1)))
  return { schedule, groups, warnings }
}

export interface GroupStanding {
  entryId: string
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

export function groupStandings(
  group: Entry[],
  matches: GroupMatch[],
): GroupStanding[] {
  const stats = new Map<string, GroupStanding>()
  for (const e of group)
    stats.set(e.id, {
      entryId: e.id,
      name: e.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      diff: 0,
      rank: 0,
    })
  for (const m of matches) {
    if (m.scoreA == null || m.scoreB == null) continue
    const a = stats.get(m.entryA)
    const b = stats.get(m.entryB)
    if (!a || !b) continue
    a.played++
    b.played++
    a.gamesFor += m.scoreA
    a.gamesAgainst += m.scoreB
    b.gamesFor += m.scoreB
    b.gamesAgainst += m.scoreA
    if (m.scoreA > m.scoreB) {
      a.wins++
      b.losses++
    } else if (m.scoreA < m.scoreB) {
      b.wins++
      a.losses++
    } else {
      a.draws++
      b.draws++
    }
  }
  const rows = Array.from(stats.values())
  for (const r of rows) r.diff = r.gamesFor - r.gamesAgainst
  rows.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.diff !== b.diff) return b.diff - a.diff
    if (a.gamesFor !== b.gamesFor) return b.gamesFor - a.gamesFor
    return a.name.localeCompare(b.name, 'de')
  })

  // Head-to-head tiebreaker: within clusters of equal wins/diff/gamesFor,
  // re-order by direct match outcome (winner ahead). Only applies cleanly to
  // pairs; for larger ties, head-to-head wins inside the cluster decide.
  const h2h = (aId: string, bId: string): number => {
    const m = matches.find(
      (m) =>
        ((m.entryA === aId && m.entryB === bId) ||
          (m.entryA === bId && m.entryB === aId)) &&
        m.scoreA != null &&
        m.scoreB != null,
    )
    if (!m) return 0
    const aFor = m.entryA === aId ? m.scoreA! : m.scoreB!
    const bFor = m.entryA === bId ? m.scoreA! : m.scoreB!
    if (aFor === bFor) return 0
    return aFor > bFor ? -1 : 1
  }

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
    if (j - i >= 2) {
      const cluster = rows.slice(i, j)
      cluster.sort((a, b) => {
        const r = h2h(a.entryId, b.entryId)
        if (r !== 0) return r
        return a.name.localeCompare(b.name, 'de')
      })
      for (let k = 0; k < cluster.length; k++) rows[i + k] = cluster[k]
    }
    for (let k = i; k < j; k++) rows[k].rank = i + 1
    i = j
  }
  return rows
}
