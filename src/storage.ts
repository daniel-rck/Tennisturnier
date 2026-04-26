import type { Tournament } from './types'

const KEY = 'tennisturnier:v1'

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
})

export function loadTournament(): Tournament {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultTournament()
    const parsed = JSON.parse(raw) as Partial<Tournament>
    return { ...defaultTournament(), ...parsed }
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
