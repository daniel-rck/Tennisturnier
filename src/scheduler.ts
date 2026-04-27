import type { Match, Mode, Player, Round, Tournament } from './types'

export interface ScheduleResult {
  rounds: Round[]
  warnings: string[]
}

interface PairingState {
  partner: Map<string, Map<string, number>>
  opponent: Map<string, Map<string, number>>
  plays: Map<string, number>
  rests: Map<string, number>
}

const inc = (m: Map<string, Map<string, number>>, a: string, b: string) => {
  if (!m.has(a)) m.set(a, new Map())
  const inner = m.get(a)!
  inner.set(b, (inner.get(b) ?? 0) + 1)
}

const get = (m: Map<string, Map<string, number>>, a: string, b: string) =>
  m.get(a)?.get(b) ?? 0

const initState = (players: Player[]): PairingState => ({
  partner: new Map(),
  opponent: new Map(),
  plays: new Map(players.map((p) => [p.id, 0])),
  rests: new Map(players.map((p) => [p.id, 0])),
})

function pickPlaying(
  state: PairingState,
  candidates: Player[],
  count: number,
  manualOrder: Map<string, number>,
): Player[] {
  if (candidates.length <= count) return candidates.slice()
  const sorted = candidates.slice().sort((a, b) => {
    const ar = state.rests.get(a.id) ?? 0
    const br = state.rests.get(b.id) ?? 0
    if (ar !== br) return br - ar
    const ap = state.plays.get(a.id) ?? 0
    const bp = state.plays.get(b.id) ?? 0
    if (ap !== bp) return ap - bp
    return (manualOrder.get(a.id) ?? 0) - (manualOrder.get(b.id) ?? 0)
  })
  return sorted.slice(0, count)
}

function pairCost(state: PairingState, a: string, b: string): number {
  return get(state.partner, a, b) * 100
}

function vsCost(state: PairingState, team: [string, string], opp: [string, string]): number {
  let c = 0
  for (const x of team) for (const y of opp) c += get(state.opponent, x, y)
  return c
}

function bestBipartiteMatching(
  women: Player[],
  men: Player[],
  state: PairingState,
): Array<[string, string]> {
  const n = Math.min(women.length, men.length)
  if (n === 0) return []
  const wIds = women.slice(0, n).map((p) => p.id)
  const mIds = men.slice(0, n).map((p) => p.id)

  if (n <= 8) {
    const perm = mIds.slice()
    let best = perm.slice()
    let bestCost = Infinity
    const permute = (k: number) => {
      if (k === perm.length) {
        let c = 0
        for (let i = 0; i < perm.length; i++)
          c += pairCost(state, wIds[i], perm[i])
        if (c < bestCost) {
          bestCost = c
          best = perm.slice()
        }
        return
      }
      for (let i = k; i < perm.length; i++) {
        ;[perm[k], perm[i]] = [perm[i], perm[k]]
        permute(k + 1)
        ;[perm[k], perm[i]] = [perm[i], perm[k]]
      }
    }
    permute(0)
    return wIds.map((w, i) => [w, best[i]] as [string, string])
  }

  // For n > 8, use the Hungarian algorithm (O(n³)).
  const cost: number[][] = wIds.map((w) =>
    mIds.map((m) => pairCost(state, w, m)),
  )
  const assignment = hungarian(cost)
  return wIds.map((w, i) => [w, mIds[assignment[i]]] as [string, string])
}

/** Hungarian algorithm for square cost matrix (rectangular by padding caller-side).
 *  Returns assignment[i] = column j assigned to row i. */
function hungarian(cost: number[][]): number[] {
  const n = cost.length
  // u[i], v[j] dual potentials; p[j] = row matched to column j (1-indexed style).
  const u = new Array<number>(n + 1).fill(0)
  const v = new Array<number>(n + 1).fill(0)
  const p = new Array<number>(n + 1).fill(0)
  const way = new Array<number>(n + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    p[0] = i
    let j0 = 0
    const minv = new Array<number>(n + 1).fill(Infinity)
    const used = new Array<boolean>(n + 1).fill(false)
    do {
      used[j0] = true
      const i0 = p[j0]
      let delta = Infinity
      let j1 = 0
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
        if (cur < minv[j]) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta
          v[j] -= delta
        } else {
          minv[j] -= delta
        }
      }
      j0 = j1
    } while (p[j0] !== 0)
    do {
      const j1 = way[j0]
      p[j0] = p[j1]
      j0 = j1
    } while (j0 !== 0)
  }
  const ans = new Array<number>(n).fill(0)
  for (let j = 1; j <= n; j++) {
    if (p[j] !== 0) ans[p[j] - 1] = j - 1
  }
  return ans
}

function bestSamePairing(
  players: Player[],
  state: PairingState,
): Array<[string, string]> {
  const ids = players.map((p) => p.id)
  if (ids.length < 2) return []
  if (ids.length % 2 === 1) ids.pop()

  if (ids.length <= 8) {
    let best: Array<[string, string]> = []
    let bestCost = Infinity
    const search = (remaining: string[], current: Array<[string, string]>, cost: number) => {
      if (remaining.length === 0) {
        if (cost < bestCost) {
          bestCost = cost
          best = current.slice()
        }
        return
      }
      const a = remaining[0]
      for (let i = 1; i < remaining.length; i++) {
        const b = remaining[i]
        const next = remaining.slice(1)
        next.splice(i - 1, 1)
        const addCost = pairCost(state, a, b)
        if (cost + addCost >= bestCost) continue
        search(next, [...current, [a, b]], cost + addCost)
      }
    }
    search(ids, [], 0)
    return best
  }

  const remaining = new Set(ids)
  const result: Array<[string, string]> = []
  while (remaining.size >= 2) {
    let pick: [string, string] | null = null
    let pickCost = Infinity
    const arr = Array.from(remaining)
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const c = pairCost(state, arr[i], arr[j])
        if (c < pickCost) {
          pickCost = c
          pick = [arr[i], arr[j]]
        }
      }
    }
    if (!pick) break
    result.push(pick)
    remaining.delete(pick[0])
    remaining.delete(pick[1])
  }
  return result
}

function assignToCourts(
  pairs: Array<[string, string]>,
  state: PairingState,
): Array<[[string, string], [string, string]]> {
  if (pairs.length < 2) return []
  const evenPairs = pairs.length % 2 === 0 ? pairs : pairs.slice(0, -1)

  if (evenPairs.length <= 8) {
    let best: Array<[[string, string], [string, string]]> = []
    let bestCost = Infinity
    const search = (
      remaining: Array<[string, string]>,
      current: Array<[[string, string], [string, string]]>,
      cost: number,
    ) => {
      if (remaining.length === 0) {
        if (cost < bestCost) {
          bestCost = cost
          best = current.slice()
        }
        return
      }
      const a = remaining[0]
      for (let i = 1; i < remaining.length; i++) {
        const b = remaining[i]
        const next = remaining.slice(1)
        next.splice(i - 1, 1)
        const addCost = vsCost(state, a, b)
        if (cost + addCost >= bestCost) continue
        search(next, [...current, [a, b]], cost + addCost)
      }
    }
    search(evenPairs, [], 0)
    return best
  }

  const remaining = evenPairs.slice()
  const result: Array<[[string, string], [string, string]]> = []
  while (remaining.length >= 2) {
    const a = remaining.shift()!
    let pickIdx = 0
    let pickCost = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const c = vsCost(state, a, remaining[i])
      if (c < pickCost) {
        pickCost = c
        pickIdx = i
      }
    }
    const b = remaining.splice(pickIdx, 1)[0]
    result.push([a, b])
  }
  return result
}

function applyMatches(state: PairingState, matches: Match[]) {
  for (const m of matches) {
    const [a1, a2] = m.teamA.players
    const [b1, b2] = m.teamB.players
    inc(state.partner, a1, a2)
    inc(state.partner, a2, a1)
    inc(state.partner, b1, b2)
    inc(state.partner, b2, b1)
    for (const x of [a1, a2]) {
      for (const y of [b1, b2]) {
        inc(state.opponent, x, y)
        inc(state.opponent, y, x)
      }
    }
    for (const id of [a1, a2, b1, b2]) {
      state.plays.set(id, (state.plays.get(id) ?? 0) + 1)
    }
  }
}

function applyRests(state: PairingState, all: Player[], played: Set<string>) {
  for (const p of all) {
    if (!played.has(p.id))
      state.rests.set(p.id, (state.rests.get(p.id) ?? 0) + 1)
  }
}

export function generateSchedule(t: Tournament): ScheduleResult {
  const warnings: string[] = []
  const womenRaw = t.players.filter((p) => p.gender === 'F')
  const menRaw = t.players.filter((p) => p.gender === 'M')
  const manualOrder = new Map(t.players.map((p, i) => [p.id, i]))

  // Mixed-Modus: bei ungleicher Geschlechterverteilung die rangletzten
  // Spieler:innen des Überschuss-Geschlechts als Gegengeschlecht einsetzen,
  // damit möglichst viele Plätze belegt werden können.
  let women = womenRaw
  let men = menRaw
  if (t.mode === 'mixed' && womenRaw.length !== menRaw.length) {
    const diff = Math.abs(womenRaw.length - menRaw.length)
    const reassignCount = Math.floor(diff / 2)
    if (reassignCount > 0) {
      if (menRaw.length > womenRaw.length) {
        const moved = menRaw.slice(menRaw.length - reassignCount)
        men = menRaw.slice(0, menRaw.length - reassignCount)
        women = [...womenRaw, ...moved]
        warnings.push(
          `Geschlechter unausgeglichen — ${reassignCount} ${reassignCount === 1 ? 'Herr spielt' : 'Herren spielen'} als Dame: ${moved
            .map((p) => p.name)
            .join(', ')}.`,
        )
      } else {
        const moved = womenRaw.slice(womenRaw.length - reassignCount)
        women = womenRaw.slice(0, womenRaw.length - reassignCount)
        men = [...menRaw, ...moved]
        warnings.push(
          `Geschlechter unausgeglichen — ${reassignCount} ${reassignCount === 1 ? 'Dame spielt' : 'Damen spielen'} als Herr: ${moved
            .map((p) => p.name)
            .join(', ')}.`,
        )
      }
    }
  }

  let courtsPossible = t.courts

  if (t.mode === 'mixed') {
    const possibleByWomen = Math.floor(women.length / 2)
    const possibleByMen = Math.floor(men.length / 2)
    courtsPossible = Math.min(t.courts, possibleByWomen, possibleByMen)
  } else if (t.mode === 'women') {
    courtsPossible = Math.min(t.courts, Math.floor(women.length / 4))
  } else if (t.mode === 'men') {
    courtsPossible = Math.min(t.courts, Math.floor(men.length / 4))
  } else {
    courtsPossible = Math.min(t.courts, Math.floor(t.players.length / 4))
  }

  if (courtsPossible <= 0) {
    warnings.push(
      `Zu wenige Spieler:innen für den Modus „${t.mode}“. Es kann kein Platz besetzt werden.`,
    )
    return { rounds: [], warnings }
  }
  if (courtsPossible < t.courts) {
    warnings.push(
      `Nur ${courtsPossible} von ${t.courts} Plätzen können besetzt werden — zu wenige passende Spieler:innen für „${labelMode(
        t.mode,
      )}“.`,
    )
  }

  const state = initState(t.players)
  const rounds: Round[] = []

  for (let r = 0; r < t.rounds; r++) {
    const playing: Player[] = []
    if (t.mode === 'mixed') {
      const wPick = pickPlaying(state, women, courtsPossible * 2, manualOrder)
      const mPick = pickPlaying(state, men, courtsPossible * 2, manualOrder)
      playing.push(...wPick, ...mPick)
      const pairs = bestBipartiteMatching(wPick, mPick, state)
      const courts = assignToCourts(pairs, state)
      const matches: Match[] = courts.map(([teamA, teamB], i) => ({
        court: i + 1,
        teamA: { players: teamA },
        teamB: { players: teamB },
      }))
      const playedSet = new Set(playing.map((p) => p.id))
      applyMatches(state, matches)
      applyRests(state, t.players, playedSet)
      rounds.push({
        index: r + 1,
        matches,
        resting: t.players
          .filter((p) => !playedSet.has(p.id))
          .map((p) => p.id),
      })
    } else {
      const pool =
        t.mode === 'women' ? women : t.mode === 'men' ? men : t.players
      const pick = pickPlaying(state, pool, courtsPossible * 4, manualOrder)
      // ensure even count for pairing
      const usable = pick.length - (pick.length % 2)
      const pickEven = pick.slice(0, usable)
      const pairs = bestSamePairing(pickEven, state)
      const courts = assignToCourts(pairs, state)
      const matches: Match[] = courts.map(([teamA, teamB], i) => ({
        court: i + 1,
        teamA: { players: teamA },
        teamB: { players: teamB },
      }))
      const playedSet = new Set<string>()
      for (const m of matches) {
        m.teamA.players.forEach((id) => playedSet.add(id))
        m.teamB.players.forEach((id) => playedSet.add(id))
      }
      applyMatches(state, matches)
      applyRests(state, t.players, playedSet)
      rounds.push({
        index: r + 1,
        matches,
        resting: t.players
          .filter((p) => !playedSet.has(p.id))
          .map((p) => p.id),
      })
    }
  }

  return { rounds, warnings }
}

function labelMode(m: Mode): string {
  return {
    mixed: 'Gemischtes Doppel',
    women: 'Damen-Doppel',
    men: 'Herren-Doppel',
    open: 'Freies Doppel',
  }[m]
}
