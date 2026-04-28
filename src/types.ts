export type Gender = 'F' | 'M'
export type Mode = 'mixed' | 'women' | 'men' | 'open'
export type Format = 'rotation' | 'groups' | 'knockout' | 'groups-ko'
export type EntryFormat = 'singles' | 'doubles'

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

/** A fixed team (singles = 1 member, doubles = 2 members). */
export interface Entry {
  id: string
  name: string
  members: string[]
}

export interface GroupMatch {
  group: number
  matchIndex: number
  entryA: string
  entryB: string
  scoreA?: number
  scoreB?: number
}

export type BracketSlot =
  | { kind: 'entry'; entryId: string }
  | { kind: 'feeder'; matchId: string; loser?: boolean }
  | { kind: 'group-rank'; group: number; rank: number }
  | { kind: 'bye' }
  | { kind: 'empty' }

export interface BracketMatch {
  matchId: string
  round: number
  position: number
  slotA: BracketSlot
  slotB: BracketSlot
  scoreA?: number
  scoreB?: number
}

export interface Tournament {
  name: string
  format: Format

  // Always
  courts: number
  timerMinutes: number

  // Rotation-only
  mode: Mode
  rounds: number
  players: Player[]
  schedule: Round[]
  /** Allow the last round to have fewer matches (or be skipped) so every
   *  player ends up with the same number of games. */
  allowPartialFinalRound: boolean

  // Groups/KO-only
  entryFormat: EntryFormat
  entries: Entry[]
  groupCount: number
  advancePerGroup: number
  groupSchedule: GroupMatch[]
  bracket: BracketMatch[]
  /** Persisted assignment of entry IDs into groups. Empty until first build. */
  groupAssignment: string[][]
  /** Whether the bracket includes a 3rd-place match. */
  thirdPlaceMatch: boolean
  /** In Mixed-Rotation: also show separate Damen / Herren rankings. */
  perGenderRanking: boolean
  /** Multi-device live sync — opt-in. */
  sync?: SyncConfig
  /** Award-ceremony reveal state per category. */
  reveal: RevealState
}

export type RevealCategory = 'overall' | 'women' | 'men'

/**
 * 0 = nothing revealed, 3 = up to bronze visible, 2 = silver too, 1 = all incl. gold.
 */
export type RevealStep = 0 | 1 | 2 | 3

export interface RevealState {
  /** When true, RankingPanel switches to the show stage. */
  active: boolean
  /** Which podium positions are unveiled, per category. */
  steps: Record<RevealCategory, RevealStep>
}

export interface SyncConfig {
  shareCode: string
  /** Only present on the owner device — never serialise into JSON export. */
  ownerToken?: string
  enabled: boolean
}

export const MODE_LABELS: Record<Mode, string> = {
  mixed: 'Gemischtes Doppel',
  women: 'Damen-Doppel',
  men: 'Herren-Doppel',
  open: 'Freies Doppel',
}

export const FORMAT_LABELS: Record<Format, string> = {
  rotation: 'Wechselturnier (Mixed)',
  groups: 'Gruppenphase',
  knockout: 'KO-System',
  'groups-ko': 'Gruppen + KO',
}

export const ENTRY_FORMAT_LABELS: Record<EntryFormat, string> = {
  singles: 'Einzel',
  doubles: 'Doppel (fixe Paare)',
}
