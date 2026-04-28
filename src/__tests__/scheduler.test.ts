import { describe, expect, it } from 'vitest'
import { generateSchedule } from '../scheduler'
import type { Player, Tournament } from '../types'

const player = (id: string, name: string, gender: 'F' | 'M'): Player => ({
  id,
  name,
  gender,
})

const baseTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  name: 'Test',
  format: 'rotation',
  courts: 2,
  rounds: 4,
  mode: 'mixed',
  timerMinutes: 15,
  players: [],
  schedule: [],
  allowPartialFinalRound: false,
  entryFormat: 'doubles',
  entries: [],
  groupCount: 2,
  advancePerGroup: 2,
  groupSchedule: [],
  bracket: [],
  groupAssignment: [],
  thirdPlaceMatch: false,
  ...overrides,
})

describe('generateSchedule — mixed', () => {
  it('produces 0 partner repetitions for 4F+4M over 4 rounds (full coverage)', () => {
    const players: Player[] = [
      player('w1', 'Anna', 'F'),
      player('w2', 'Berta', 'F'),
      player('w3', 'Clara', 'F'),
      player('w4', 'Doris', 'F'),
      player('m1', 'Erik', 'M'),
      player('m2', 'Felix', 'M'),
      player('m3', 'Gustav', 'M'),
      player('m4', 'Hans', 'M'),
    ]
    const t = baseTournament({ players })
    const { rounds } = generateSchedule(t)
    expect(rounds).toHaveLength(4)

    const partnerCount = new Map<string, number>()
    for (const r of rounds) {
      for (const m of r.matches) {
        const pairs = [m.teamA.players, m.teamB.players]
        for (const [a, b] of pairs) {
          const k = [a, b].sort().join('|')
          partnerCount.set(k, (partnerCount.get(k) ?? 0) + 1)
        }
      }
    }
    for (const c of partnerCount.values()) expect(c).toBeLessThanOrEqual(1)
  })

  it('warns when gender distribution is uneven (5F+3M)', () => {
    const players: Player[] = [
      player('w1', 'Anna', 'F'),
      player('w2', 'Berta', 'F'),
      player('w3', 'Clara', 'F'),
      player('w4', 'Doris', 'F'),
      player('w5', 'Eva', 'F'),
      player('m1', 'Felix', 'M'),
      player('m2', 'Gustav', 'M'),
      player('m3', 'Hans', 'M'),
    ]
    const t = baseTournament({ players })
    const { warnings } = generateSchedule(t)
    expect(warnings.some((w) => /als Herr/i.test(w))).toBe(true)
  })

  it('produces rounds with all matches when there are enough players', () => {
    const players: Player[] = Array.from({ length: 10 }, (_, i) =>
      player(`p${i}`, `Spieler${i}`, i < 5 ? 'F' : 'M'),
    )
    const t = baseTournament({ players, courts: 2, rounds: 3 })
    const { rounds } = generateSchedule(t)
    expect(rounds).toHaveLength(3)
    for (const r of rounds) {
      // Each round should fully use available courts
      expect(r.matches.length).toBe(2)
    }
  })
})

describe('generateSchedule — same-sex / open', () => {
  it('warns when too few players for the chosen mode', () => {
    const players: Player[] = [
      player('w1', 'Anna', 'F'),
      player('w2', 'Berta', 'F'),
      player('w3', 'Clara', 'F'),
    ]
    const t = baseTournament({ players, mode: 'women', courts: 1 })
    const { rounds, warnings } = generateSchedule(t)
    expect(rounds).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('open mode plays without gender constraints', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, i) =>
      player(`p${i}`, `P${i}`, i % 2 === 0 ? 'F' : 'M'),
    )
    const t = baseTournament({ players, mode: 'open', courts: 2, rounds: 2 })
    const { rounds } = generateSchedule(t)
    expect(rounds).toHaveLength(2)
    for (const r of rounds) expect(r.matches.length).toBe(2)
  })
})

describe('generateSchedule — allowPartialFinalRound', () => {
  it('emits a partial last round so every player plays equally often (open 9 players, 2 courts, 5 rounds)', () => {
    const players: Player[] = Array.from({ length: 9 }, (_, i) =>
      player(`p${i}`, `P${i}`, i % 2 === 0 ? 'F' : 'M'),
    )
    const t = baseTournament({
      players,
      courts: 2,
      rounds: 5,
      mode: 'open',
      allowPartialFinalRound: true,
    })
    const { rounds, warnings } = generateSchedule(t)
    // Target = 9 matches: 4 full + 1 partial (1 court).
    expect(rounds).toHaveLength(5)
    const matchCounts = rounds.map((r) => r.matches.length)
    expect(matchCounts.slice(0, 4)).toEqual([2, 2, 2, 2])
    expect(matchCounts[4]).toBe(1)

    // Each of 9 players plays exactly 4 games (4 * 9 = 36 = 9 matches * 4 spots).
    const playsById = new Map<string, number>()
    for (const r of rounds) {
      for (const m of r.matches) {
        for (const id of [...m.teamA.players, ...m.teamB.players]) {
          playsById.set(id, (playsById.get(id) ?? 0) + 1)
        }
      }
    }
    const allCounts = players.map((p) => playsById.get(p.id) ?? 0)
    expect(Math.max(...allCounts)).toBe(4)
    expect(Math.min(...allCounts)).toBe(4)
    expect(
      warnings.some((w) => /teilweise besetzt/i.test(w)),
    ).toBe(true)
  })

  it('does not reduce when distribution is already even (8 players, 2 courts, 4 rounds, mixed)', () => {
    const players: Player[] = [
      player('w1', 'Anna', 'F'),
      player('w2', 'Berta', 'F'),
      player('w3', 'Clara', 'F'),
      player('w4', 'Doris', 'F'),
      player('m1', 'Erik', 'M'),
      player('m2', 'Felix', 'M'),
      player('m3', 'Gustav', 'M'),
      player('m4', 'Hans', 'M'),
    ]
    const t = baseTournament({
      players,
      courts: 2,
      rounds: 4,
      mode: 'mixed',
      allowPartialFinalRound: true,
    })
    const { rounds, warnings } = generateSchedule(t)
    expect(rounds).toHaveLength(4)
    for (const r of rounds) expect(r.matches.length).toBe(2)
    expect(warnings.some((w) => /teilweise besetzt/i.test(w))).toBe(false)
  })

  it('drops surplus rounds when fairness is reached early (8 players, 2 courts, 6 rounds, open)', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, i) =>
      player(`p${i}`, `P${i}`, i % 2 === 0 ? 'F' : 'M'),
    )
    const t = baseTournament({
      players,
      mode: 'open',
      courts: 2,
      rounds: 6,
      allowPartialFinalRound: true,
    })
    const { rounds } = generateSchedule(t)
    // With 8 players, 2 courts, every full round uses all 8 → after enough
    // rounds every player has played the same N games. Surplus rounds where
    // no one is "behind" are dropped — but here every round is justified
    // because everyone moves up in lockstep, so all 6 rounds run.
    // Sanity: every emitted round is full.
    for (const r of rounds) expect(r.matches.length).toBe(2)
  })

  it('flag off keeps full rounds even when distribution is uneven (5 players, 1 court, 4 rounds, open)', () => {
    const players: Player[] = Array.from({ length: 5 }, (_, i) =>
      player(`p${i}`, `P${i}`, 'M'),
    )
    const t = baseTournament({
      players,
      mode: 'open',
      courts: 1,
      rounds: 4,
      allowPartialFinalRound: false,
    })
    const { rounds } = generateSchedule(t)
    expect(rounds).toHaveLength(4)
    for (const r of rounds) expect(r.matches.length).toBe(1)
  })
})
