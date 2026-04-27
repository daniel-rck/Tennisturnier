import { describe, expect, it } from 'vitest'
import {
  buildBracket,
  entrySlots,
  groupAdvanceSlots,
  groupLetter,
  resolveBracket,
} from '../knockoutScheduler'

describe('buildBracket', () => {
  it('returns empty for n<2', () => {
    expect(buildBracket(entrySlots([]))).toEqual([])
    expect(buildBracket(entrySlots(['a']))).toEqual([])
  })

  it('builds a bracket of size 2 (single final)', () => {
    const m = buildBracket(entrySlots(['a', 'b']))
    expect(m).toHaveLength(1)
    expect(m[0].matchId).toBe('R1-M1')
  })

  it('pads to next power of two and assigns byes to top seeds', () => {
    const m = buildBracket(entrySlots(['a', 'b', 'c', 'd', 'e']))
    // size = 8 -> 4 R1, 2 R2, 1 F = 7 matches
    expect(m).toHaveLength(7)
    // First match: seed 1 (a) vs seed 8 (bye)
    const r1m1 = m.find((x) => x.matchId === 'R1-M1')!
    expect(r1m1.slotA).toEqual({ kind: 'entry', entryId: 'a' })
    expect(r1m1.slotB.kind).toBe('bye')
  })

  it('includes a 3rd-place match when option is set', () => {
    const m = buildBracket(entrySlots(['a', 'b', 'c', 'd']), {
      thirdPlaceMatch: true,
    })
    const ids = m.map((x) => x.matchId)
    expect(ids).toContain('3P')
    expect(ids).toContain('F')
    const tp = m.find((x) => x.matchId === '3P')!
    expect(tp.slotA.kind).toBe('feeder')
    if (tp.slotA.kind === 'feeder') expect(tp.slotA.loser).toBe(true)
  })
})

describe('groupAdvanceSlots', () => {
  it('interleaves rank-then-group', () => {
    const slots = groupAdvanceSlots(2, 2)
    // rank 1: 1A,1B; rank 2: 2A,2B
    expect(slots).toHaveLength(4)
    expect(slots[0]).toEqual({ kind: 'group-rank', group: 1, rank: 1 })
    expect(slots[1]).toEqual({ kind: 'group-rank', group: 2, rank: 1 })
    expect(slots[2]).toEqual({ kind: 'group-rank', group: 1, rank: 2 })
    expect(slots[3]).toEqual({ kind: 'group-rank', group: 2, rank: 2 })
  })
})

describe('groupLetter', () => {
  it('maps 1 -> A, 2 -> B', () => {
    expect(groupLetter(1)).toBe('A')
    expect(groupLetter(2)).toBe('B')
  })
})

describe('resolveBracket', () => {
  const name = (id: string) => `name-${id}`

  it('propagates winners and detects bye matches', () => {
    const bracket = buildBracket(entrySlots(['a', 'b', 'c']))
    // size=4 -> 4 padded slots (a, bye, c, b) per seedOrder([1,4,3,2])
    // R1-M1: a vs (seed 4=bye) -> bye -> a
    // R1-M2: c vs b
    const withScores = bracket.map((m) =>
      m.matchId === 'R1-M2' ? { ...m, scoreA: 6, scoreB: 4 } : m,
    )
    const resolved = resolveBracket(withScores, name)
    const r1m1 = resolved.find((m) => m.matchId === 'R1-M1')!
    expect(r1m1.isByeMatch).toBe(true)
    expect(r1m1.winner).toBe('a')

    const final = resolved.find((m) => m.matchId === 'F')!
    // Final A is feeder R1-M1 (a), final B is feeder R1-M2 (winner of c vs b)
    expect(final.entryA).toBe('a')
  })

  it('does not declare a winner on a tie', () => {
    const bracket = buildBracket(entrySlots(['a', 'b']))
    const withScores = bracket.map((m) => ({ ...m, scoreA: 6, scoreB: 6 }))
    const resolved = resolveBracket(withScores, name)
    expect(resolved[0].winner).toBeNull()
  })

  it('resolves loser feeders for 3rd place match', () => {
    const bracket = buildBracket(entrySlots(['a', 'b', 'c', 'd']), {
      thirdPlaceMatch: true,
    })
    const withScores = bracket.map((m) => {
      if (m.matchId === 'R1-M1') return { ...m, scoreA: 6, scoreB: 0 } // a beats d (seed 4) - actually depends on seedOrder
      if (m.matchId === 'R1-M2') return { ...m, scoreA: 6, scoreB: 0 }
      return m
    })
    const resolved = resolveBracket(withScores, name)
    const tp = resolved.find((m) => m.matchId === '3P')!
    // After both R1 matches decided, 3P should reference losers
    expect(tp.entryA).not.toBeNull()
    expect(tp.entryB).not.toBeNull()
  })
})
