import { describe, expect, it } from 'vitest'
import { defaultTournament, migrate } from '../storage'

describe('migrate', () => {
  it('returns defaults for null/undefined/string input', () => {
    expect(migrate(null)).toEqual(defaultTournament())
    expect(migrate(undefined)).toEqual(defaultTournament())
    expect(migrate('garbage')).toEqual(defaultTournament())
  })

  it('migrates a v1 tournament without groupAssignment', () => {
    const v1 = {
      name: 'Old',
      format: 'rotation',
      courts: 3,
      rounds: 4,
      mode: 'mixed',
      timerMinutes: 20,
      players: [{ id: 'p1', name: 'A', gender: 'F' }],
      schedule: [],
      entryFormat: 'doubles',
      entries: [],
      groupCount: 2,
      advancePerGroup: 2,
      groupSchedule: [],
      bracket: [],
    }
    const migrated = migrate(v1)
    expect(migrated.groupAssignment).toEqual([])
    expect(migrated.thirdPlaceMatch).toBe(false)
    expect(migrated.players).toHaveLength(1)
    expect(migrated.courts).toBe(3)
  })

  it('drops malformed entries (missing id)', () => {
    const v1 = {
      entries: [
        { id: 'a', name: 'A', members: ['x'] },
        { name: 'no-id', members: ['x'] },
        null,
      ],
    }
    const migrated = migrate(v1)
    expect(migrated.entries).toHaveLength(1)
    expect(migrated.entries[0].id).toBe('a')
  })

  it('fills missing members[] with empty array', () => {
    const v1 = {
      entries: [{ id: 'a', name: 'A' }],
    }
    const migrated = migrate(v1)
    expect(migrated.entries[0].members).toEqual([])
  })
})
