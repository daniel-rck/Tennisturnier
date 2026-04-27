import type { Entry, Tournament } from './types'

const KEY_V1 = 'tennisturnier:v1'
const KEY = 'tennisturnier:v2'

export const defaultTournament = (): Tournament => ({
  name: 'Vereinsturnier',
  format: 'rotation',
  courts: 2,
  rounds: 5,
  mode: 'mixed',
  timerMinutes: 15,
  players: [],
  schedule: [],
  entryFormat: 'doubles',
  entries: [],
  groupCount: 2,
  advancePerGroup: 2,
  groupSchedule: [],
  bracket: [],
  groupAssignment: [],
  thirdPlaceMatch: false,
  perGenderRanking: false,
})

/** Migrate a partial / older tournament shape onto current defaults. Defensive — never throws. */
export function migrate(parsed: unknown): Tournament {
  const base = defaultTournament()
  if (!parsed || typeof parsed !== 'object') return base
  const p = parsed as Partial<Tournament> & { entries?: unknown }

  // Sanitize entries: every entry must have id, name, members[]
  const entries: Entry[] = Array.isArray(p.entries)
    ? p.entries.flatMap((e) => {
        if (!e || typeof e !== 'object') return []
        const o = e as Partial<Entry>
        if (typeof o.id !== 'string') return []
        const members = Array.isArray(o.members)
          ? o.members.filter((m): m is string => typeof m === 'string')
          : []
        return [
          {
            id: o.id,
            name: typeof o.name === 'string' ? o.name : members.join(' & '),
            members,
          },
        ]
      })
    : []

  return {
    ...base,
    ...p,
    entries,
    players: Array.isArray(p.players) ? p.players : [],
    schedule: Array.isArray(p.schedule) ? p.schedule : [],
    groupSchedule: Array.isArray(p.groupSchedule) ? p.groupSchedule : [],
    bracket: Array.isArray(p.bracket) ? p.bracket : [],
    groupAssignment: Array.isArray(p.groupAssignment) ? p.groupAssignment : [],
    thirdPlaceMatch: typeof p.thirdPlaceMatch === 'boolean' ? p.thirdPlaceMatch : false,
    perGenderRanking: typeof p.perGenderRanking === 'boolean' ? p.perGenderRanking : false,
  }
}

export function loadTournament(): Tournament {
  try {
    const rawV2 = localStorage.getItem(KEY)
    if (rawV2) return migrate(JSON.parse(rawV2))
    const rawV1 = localStorage.getItem(KEY_V1)
    if (rawV1) {
      const migrated = migrate(JSON.parse(rawV1))
      // Persist under new key, leave v1 in place for safety.
      try {
        localStorage.setItem(KEY, JSON.stringify(migrated))
      } catch {
        /* ignore */
      }
      return migrated
    }
    return defaultTournament()
  } catch {
    return defaultTournament()
  }
}

export function saveTournament(t: Tournament): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(t))
  } catch {
    // ignore quota errors — non-critical
  }
}
