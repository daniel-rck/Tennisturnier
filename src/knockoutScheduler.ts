import type { BracketMatch, BracketSlot } from './types'
import { germanFallback, type Translate } from './i18n/fallback'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10)

const nextPow2 = (n: number) => {
  let p = 1
  while (p < n) p <<= 1
  return p
}

/** Standard tennis seeding for size 2^k: positions 1..size such that
 *  highest seeds are spread maximally. seedOrder[i] = seed (1-based). */
function seedOrder(size: number): number[] {
  let order = [1, 2]
  while (order.length < size) {
    const len = order.length
    const next: number[] = []
    for (const s of order) {
      next.push(s)
      next.push(2 * len + 1 - s)
    }
    order = next
  }
  return order
}

/** Build a single-elimination bracket from given slot seeds (length = nEntries).
 *  Pads with byes to next power of 2 and gives byes to top seeds. */
export function buildBracket(
  slots: BracketSlot[],
  options: { thirdPlaceMatch?: boolean } = {},
): BracketMatch[] {
  const n = slots.length
  if (n < 2) return []
  const size = nextPow2(n)
  const order = seedOrder(size) // length = size, values 1..size
  const padded: BracketSlot[] = order.map((seed) =>
    seed <= n ? slots[seed - 1] : { kind: 'bye' },
  )

  const matches: BracketMatch[] = []
  // Round 1
  const round1Ids: string[] = []
  for (let i = 0; i < size / 2; i++) {
    const slotA = padded[2 * i]
    const slotB = padded[2 * i + 1]
    const id = `R1-M${i + 1}`
    round1Ids.push(id)
    matches.push({
      matchId: id,
      round: 1,
      position: i + 1,
      slotA,
      slotB,
    })
  }

  // Subsequent rounds
  let prev = round1Ids
  let round = 2
  let semiIds: string[] = []
  while (prev.length > 1) {
    const next: string[] = []
    const matchesInRound = prev.length / 2
    for (let i = 0; i < matchesInRound; i++) {
      const id = matchesInRound === 1 ? 'F' : `R${round}-M${i + 1}`
      next.push(id)
      matches.push({
        matchId: id,
        round,
        position: i + 1,
        slotA: { kind: 'feeder', matchId: prev[2 * i] },
        slotB: { kind: 'feeder', matchId: prev[2 * i + 1] },
      })
    }
    if (matchesInRound === 1) semiIds = prev
    prev = next
    round++
  }

  // Optional 3rd-place match: only meaningful if a final exists with two semis.
  if (options.thirdPlaceMatch && semiIds.length === 2) {
    const finalIdx = matches.findIndex((m) => m.matchId === 'F')
    const finalRound = matches[finalIdx].round
    matches.splice(finalIdx, 0, {
      matchId: '3P',
      round: finalRound,
      position: 0,
      slotA: { kind: 'feeder', matchId: semiIds[0], loser: true },
      slotB: { kind: 'feeder', matchId: semiIds[1], loser: true },
    })
  }
  return matches
}

export interface ResolvedBracketMatch {
  matchId: string
  round: number
  position: number
  isFinal: boolean
  entryA: string | null
  entryB: string | null
  pendingA: string
  pendingB: string
  scoreA?: number
  scoreB?: number
  isByeMatch: boolean
  winner: string | null
}

interface ResolveContext {
  resolveSlot: (s: BracketSlot) => { entryId: string | null; label: string }
}

/** Resolve a bracket against current scores and (for groups-ko) group winners. */
export function resolveBracket(
  bracket: BracketMatch[],
  entryName: (id: string) => string,
  groupWinner?: (group: number, rank: number) => string | undefined,
  tr: Translate = germanFallback,
): ResolvedBracketMatch[] {
  const winners = new Map<string, string | null>()
  const losers = new Map<string, string | null>()

  const resolveCtx: ResolveContext = {
    resolveSlot: (s) => {
      switch (s.kind) {
        case 'entry':
          return { entryId: s.entryId, label: entryName(s.entryId) }
        case 'feeder': {
          const map = s.loser ? losers : winners
          const w = map.get(s.matchId)
          // Match not yet decided (or referenced before processing) — surface a
          // descriptive placeholder so spectators know who will end up here.
          if (w === undefined || w === null) {
            return {
              entryId: null,
              label: tr(s.loser ? 'bracket.label.loserOf' : 'bracket.label.winnerOf', {
                match: humanMatchLabel(s.matchId, tr),
              }),
            }
          }
          return { entryId: w, label: entryName(w) }
        }
        case 'group-rank': {
          const id = groupWinner?.(s.group, s.rank)
          if (!id) {
            const placeholder =
              s.rank === 1
                ? tr('bracket.label.groupWinner', { letter: groupLetter(s.group) })
                : tr('bracket.label.groupRank', {
                    letter: groupLetter(s.group),
                    rank: s.rank,
                  })
            return { entryId: null, label: placeholder }
          }
          return { entryId: id, label: entryName(id) }
        }
        case 'bye':
          return { entryId: null, label: tr('bracket.label.bye') }
        case 'empty':
          return { entryId: null, label: tr('common.dash') }
      }
    },
  }

  // Process in topological order (round ascending). Within the same round,
  // 3rd-place match (position 0) before final (position 1).
  const sorted = bracket.slice().sort((a, b) =>
    a.round !== b.round ? a.round - b.round : a.position - b.position,
  )
  const final = sorted.find((m) => m.matchId === 'F') ?? sorted[sorted.length - 1]
  const result: ResolvedBracketMatch[] = []

  for (const m of sorted) {
    const a = resolveCtx.resolveSlot(m.slotA)
    const b = resolveCtx.resolveSlot(m.slotB)
    const isByeMatch =
      (m.slotA.kind === 'bye' && m.slotB.kind !== 'bye') ||
      (m.slotB.kind === 'bye' && m.slotA.kind !== 'bye')

    let winner: string | null = null
    let loser: string | null = null
    if (isByeMatch) {
      winner = a.entryId ?? b.entryId ?? null
    } else if (m.scoreA != null && m.scoreB != null && m.scoreA !== m.scoreB) {
      if (a.entryId && b.entryId) {
        winner = m.scoreA > m.scoreB ? a.entryId : b.entryId
        loser = m.scoreA > m.scoreB ? b.entryId : a.entryId
      }
    }
    winners.set(m.matchId, winner)
    losers.set(m.matchId, loser)
    result.push({
      matchId: m.matchId,
      round: m.round,
      position: m.position,
      isFinal: m.matchId === final?.matchId,
      entryA: a.entryId,
      entryB: b.entryId,
      pendingA: a.label,
      pendingB: b.label,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      isByeMatch,
      winner,
    })
  }
  return result
}

export function groupLetter(group: number): string {
  return String.fromCharCode(64 + group) // 1 -> 'A'
}

/** Convert internal match IDs (e.g. "R1-M1", "F", "3P") into human-readable labels. */
export function humanMatchLabel(
  matchId: string,
  tr: Translate = germanFallback,
): string {
  if (matchId === 'F') return tr('bracket.label.final')
  if (matchId === '3P') return tr('bracket.label.thirdPlace')
  const m = /^R(\d+)-M(\d+)$/.exec(matchId)
  if (m) return tr('bracket.label.match', { m: m[2], r: m[1] })
  return matchId
}

/** Build initial slots from entry IDs (entry order = seed). */
export function entrySlots(entryIds: string[]): BracketSlot[] {
  return entryIds.map((id) => ({ kind: 'entry', entryId: id }))
}

/** Build initial slots for groups+KO mode: top N from each group, seeded. */
export function groupAdvanceSlots(
  groupCount: number,
  advancePerGroup: number,
): BracketSlot[] {
  // Standard interleave: 1A,2B,1C,2D,1B,2A,1D,2C,...
  // Simplified: 1A, 2B, 1B, 2A, 1C, 2D, 1D, 2C ...
  // We'll just put 1st of each group first, then 2nd, etc., in alternating fashion.
  const slots: BracketSlot[] = []
  for (let rank = 1; rank <= advancePerGroup; rank++) {
    for (let g = 1; g <= groupCount; g++) {
      slots.push({ kind: 'group-rank', group: g, rank })
    }
  }
  return slots
}

export { newId as bracketNewId }
