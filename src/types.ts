export type Gender = 'F' | 'M'
export type Mode = 'mixed' | 'women' | 'men' | 'open'

export interface Player {
  id: string
  name: string
  gender: Gender
}

export interface Pair {
  players: [string, string]
}

export interface Match {
  court: number
  teamA: Pair
  teamB: Pair
  scoreA?: number
  scoreB?: number
}

export interface Round {
  index: number
  matches: Match[]
  resting: string[]
}

export interface Tournament {
  name: string
  courts: number
  rounds: number
  mode: Mode
  timerMinutes: number
  players: Player[]
  schedule: Round[]
}

export const MODE_LABELS: Record<Mode, string> = {
  mixed: 'Gemischtes Doppel',
  women: 'Damen-Doppel',
  men: 'Herren-Doppel',
  open: 'Freies Doppel',
}
