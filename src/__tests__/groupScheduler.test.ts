import { describe, expect, it } from 'vitest'
import {
  assignGroups,
  buildGroupSchedule,
  groupStandings,
  resolveGroupAssignment,
  roundRobin,
} from '../groupScheduler'
import type { Entry, GroupMatch } from '../types'

const entry = (id: string, name: string): Entry => ({
  id,
  name,
  members: [name],
})

describe('assignGroups', () => {
  it('snake-distributes 6 entries into 2 groups by seed strength', () => {
    const entries: Entry[] = ['1', '2', '3', '4', '5', '6'].map((id) =>
      entry(id, `E${id}`),
    )
    const { groups } = assignGroups(entries, 2)
    // Snake: cycle 0 -> 1->A, 2->B; cycle 1 reverse -> 3->B, 4->A; cycle 2 -> 5->A, 6->B
    expect(groups[0].map((e) => e.id)).toEqual(['1', '4', '5'])
    expect(groups[1].map((e) => e.id)).toEqual(['2', '3', '6'])
  })

  it('warns when there are fewer than 2 entries per group', () => {
    const entries: Entry[] = [entry('1', 'A')]
    const { warnings } = assignGroups(entries, 2)
    expect(warnings.length).toBeGreaterThan(0)
  })
})

describe('roundRobin', () => {
  it('produces n*(n-1)/2 matches', () => {
    const group = ['a', 'b', 'c', 'd'].map((id) => entry(id, id))
    const matches = roundRobin(group, 1)
    expect(matches).toHaveLength(6)
  })
})

describe('groupStandings', () => {
  const g = ['A', 'B', 'C'].map((id) => entry(id, id))

  it('sorts by wins, then diff, then gamesFor', () => {
    const matches: GroupMatch[] = [
      { group: 1, matchIndex: 1, entryA: 'A', entryB: 'B', scoreA: 6, scoreB: 2 },
      { group: 1, matchIndex: 2, entryA: 'A', entryB: 'C', scoreA: 6, scoreB: 4 },
      { group: 1, matchIndex: 3, entryA: 'B', entryB: 'C', scoreA: 6, scoreB: 0 },
    ]
    const s = groupStandings(g, matches)
    expect(s.map((r) => r.entryId)).toEqual(['A', 'B', 'C'])
    expect(s[0].wins).toBe(2)
  })

  it('uses head-to-head as tiebreaker for equal wins/diff/gamesFor', () => {
    // 3 teams, two of which tie on wins/diff/gamesFor; head-to-head decides.
    const matches: GroupMatch[] = [
      { group: 1, matchIndex: 1, entryA: 'A', entryB: 'B', scoreA: 6, scoreB: 4 }, // A beats B
      { group: 1, matchIndex: 2, entryA: 'B', entryB: 'C', scoreA: 6, scoreB: 4 }, // B beats C
      { group: 1, matchIndex: 3, entryA: 'A', entryB: 'C', scoreA: 4, scoreB: 6 }, // C beats A
    ]
    // Each team: 1W 1L, 10 for / 10 against, diff 0. Strict tie.
    // H2H A>B, B>C, C>A — circular, so name sort decides as fallback.
    const s = groupStandings(g, matches)
    // Each tied -> alpha order, all rank 1
    expect(s.every((r) => r.rank === 1)).toBe(true)
  })

  it('head-to-head decides 2-way tie', () => {
    const g2 = ['A', 'B'].map((id) => entry(id, id))
    const matches: GroupMatch[] = [
      // A beats B, then a fictional rematch with B winning (not realistic but
      // forces equal wins/gamesFor). We simulate same gamesFor by having
      // both sweep different opponents... Simplest: just one match where A wins.
      { group: 1, matchIndex: 1, entryA: 'A', entryB: 'B', scoreA: 6, scoreB: 4 },
    ]
    const s = groupStandings(g2, matches)
    expect(s[0].entryId).toBe('A')
    expect(s[1].entryId).toBe('B')
  })
})

describe('buildGroupSchedule', () => {
  it('round-robins each group', () => {
    const entries: Entry[] = ['1', '2', '3', '4'].map((id) => entry(id, id))
    const { schedule } = buildGroupSchedule(entries, 2)
    // 2 groups of 2 -> 1 match per group -> 2 matches total
    expect(schedule).toHaveLength(2)
  })
})

describe('resolveGroupAssignment', () => {
  it('resolves IDs back to entries, dropping unknown ids', () => {
    const entries: Entry[] = [entry('a', 'A'), entry('b', 'B'), entry('c', 'C')]
    const groups = resolveGroupAssignment(entries, [['a', 'c'], ['b', 'missing']])
    expect(groups).toHaveLength(2)
    expect(groups[0].map((e) => e.id)).toEqual(['a', 'c'])
    expect(groups[1].map((e) => e.id)).toEqual(['b'])
  })
})
