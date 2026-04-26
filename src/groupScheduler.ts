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
