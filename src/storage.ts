import type { Entry, RevealState, Tournament } from './types'

const KEY_V1 = 'tennisturnier:v1'
const KEY = 'tennisturnier:v2'

export const defaultReveal = (): RevealState => ({
  active: false,
  steps: { overall: 0, women: 0, men: 0 },
})

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
  reveal: defaultReveal(),
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
    reveal: sanitizeReveal(p.reveal),
    sync: sanitizeSync(p.sync),
  }
}

function sanitizeReveal(input: unknown): RevealState {
  const base = defaultReveal()
  if (!input || typeof input !== 'object') return base
  const r = input as Partial<RevealState>
  const stepIn =
    r.steps && typeof r.steps === 'object'
      ? (r.steps as Record<string, unknown>)
      : {}
  const clamp = (v: unknown): 0 | 1 | 2 | 3 => {
    const n = typeof v === 'number' ? Math.round(v) : 0
    return n === 1 || n === 2 || n === 3 ? n : 0
  }
  return {
    active: typeof r.active === 'boolean' ? r.active : false,
    steps: {
      overall: clamp(stepIn.overall),
      women: clamp(stepIn.women),
      men: clamp(stepIn.men),
    },
  }
}

function sanitizeSync(
  input: unknown,
): Tournament['sync'] {
  if (!input || typeof input !== 'object') return undefined
  const s = input as { shareCode?: unknown; ownerToken?: unknown; enabled?: unknown }
  if (typeof s.shareCode !== 'string' || s.shareCode.length === 0) return undefined
  return {
    shareCode: s.shareCode,
    ownerToken: typeof s.ownerToken === 'string' ? s.ownerToken : undefined,
    enabled: typeof s.enabled === 'boolean' ? s.enabled : false,
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
