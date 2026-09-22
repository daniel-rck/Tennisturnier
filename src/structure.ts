import { assignGroups, groupStandings, resolveGroupAssignment, roundRobin } from "./groupScheduler";
import { buildBracket, entrySlots, groupAdvanceSlots, resolveBracket } from "./knockoutScheduler";
import type { BracketMatch, BracketSlot, Entry, GroupMatch, Tournament } from "./types";

/**
 * Derived tournament structure (group assignment, group schedule, KO bracket).
 *
 * These used to be rebuilt by effects inside GroupsPanel / BracketPanel, so they
 * only existed once a panel had mounted — the live phase could not be entered
 * before that, and scores entered from the dashboard never reconciled the
 * bracket. `syncStructures` runs on every tournament update instead (see
 * useTournament) and returns the input unchanged when nothing needs rebuilding.
 */

const usesGroups = (t: Tournament) => t.format === "groups" || t.format === "groups-ko";

/** Entries per group — the persisted assignment, or a snake draft before it exists. */
export function groupsOf(t: Tournament): Entry[][] {
  if (t.groupAssignment.length !== t.groupCount) {
    return assignGroups(t.entries, t.groupCount).groups;
  }
  return resolveGroupAssignment(t.entries, t.groupAssignment);
}

/** Looks up the entry currently holding `rank` in `group` (groups-ko seeding). */
export function groupRankLookup(
  t: Tournament,
): ((group: number, rank: number) => string | undefined) | undefined {
  if (t.format !== "groups-ko") return undefined;
  const map = new Map<string, string>();
  groupsOf(t).forEach((g, gi) => {
    const standings = groupStandings(
      g,
      t.groupSchedule.filter((m) => m.group === gi + 1),
    );
    standings.forEach((s, ri) => {
      map.set(`${gi + 1}|${ri + 1}`, s.entryId);
    });
  });
  return (group, rank) => map.get(`${group}|${rank}`);
}

const groupKey = (group: number, a: string, b: string) => `${group}|${a}|${b}`;

/** Round-robin schedule for the current groups, carrying over scores of unchanged pairings. */
export function syncGroupSchedule(t: Tournament): GroupMatch[] {
  if (!usesGroups(t) || t.entries.length < 2) {
    return t.groupSchedule.length === 0 ? t.groupSchedule : [];
  }
  const expected: GroupMatch[] = [];
  groupsOf(t).forEach((g, idx) => {
    expected.push(...roundRobin(g, idx + 1));
  });
  const same =
    expected.length === t.groupSchedule.length &&
    expected.every((e, i) => {
      const m = t.groupSchedule[i];
      return (
        m !== undefined &&
        m.group === e.group &&
        m.matchIndex === e.matchIndex &&
        m.entryA === e.entryA &&
        m.entryB === e.entryB
      );
    });
  if (same) return t.groupSchedule;
  const scores = new Map<string, { a?: number; b?: number }>();
  for (const m of t.groupSchedule)
    scores.set(groupKey(m.group, m.entryA, m.entryB), { a: m.scoreA, b: m.scoreB });
  return expected.map((e) => {
    const s = scores.get(groupKey(e.group, e.entryA, e.entryB));
    return { ...e, scoreA: s?.a, scoreB: s?.b };
  });
}

export function slotEq(a: BracketSlot, b: BracketSlot): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "entry" && b.kind === "entry") return a.entryId === b.entryId;
  if (a.kind === "feeder" && b.kind === "feeder")
    return a.matchId === b.matchId && !!a.loser === !!b.loser;
  if (a.kind === "group-rank" && b.kind === "group-rank")
    return a.group === b.group && a.rank === b.rank;
  return true;
}

function desiredBracket(t: Tournament): BracketMatch[] {
  const opts = { thirdPlaceMatch: t.thirdPlaceMatch };
  if (t.format === "knockout") {
    return buildBracket(entrySlots(t.entries.map((e) => e.id)), opts);
  }
  if (t.format === "groups-ko") {
    return buildBracket(groupAdvanceSlots(t.groupCount, t.advancePerGroup), opts);
  }
  return [];
}

const hasScore = (m: BracketMatch) => m.scoreA !== undefined || m.scoreB !== undefined;

/**
 * Keep the stored bracket in line with its desired structure, and drop scores
 * that no longer belong to the pairing they were entered for.
 *
 * Scores are stored per match id while the participants are re-resolved from
 * earlier results on every render. Each scored match therefore records who
 * played (`playedA`/`playedB`); when an earlier result — or a group standing in
 * groups-ko — changes who meets in that match, its score is cleared, and so on
 * down the bracket until nothing changes.
 */
export function syncBracket(t: Tournament, groupRank = groupRankLookup(t)): BracketMatch[] {
  const desired = desiredBracket(t);
  const sameStructure =
    t.bracket.length === desired.length &&
    desired.every((d, i) => {
      const cur = t.bracket[i];
      return (
        cur !== undefined &&
        cur.matchId === d.matchId &&
        cur.round === d.round &&
        cur.position === d.position &&
        slotEq(cur.slotA, d.slotA) &&
        slotEq(cur.slotB, d.slotB)
      );
    });

  let bracket = t.bracket;
  if (!sameStructure) {
    const byId = new Map(t.bracket.map((m) => [m.matchId, m]));
    bracket = desired.map((d) => {
      const cur = byId.get(d.matchId);
      if (!cur) return d;
      return {
        ...d,
        scoreA: cur.scoreA,
        scoreB: cur.scoreB,
        playedA: cur.playedA,
        playedB: cur.playedB,
      };
    });
  }

  const name = () => "";
  // Each pass settles at least one more round; the bracket depth bounds it.
  for (let pass = 0; pass <= bracket.length; pass++) {
    const resolved = new Map(resolveBracket(bracket, name, groupRank).map((r) => [r.matchId, r]));
    let changed = false;
    const next = bracket.map((m) => {
      const r = resolved.get(m.matchId);
      if (!r || !hasScore(m)) {
        if (m.playedA === undefined && m.playedB === undefined) return m;
        changed = true;
        return { ...m, playedA: undefined, playedB: undefined };
      }
      if (m.playedA === undefined && m.playedB === undefined) {
        // Freshly entered (or legacy) score: remember who it was entered for.
        if (r.entryA === null || r.entryB === null) return m;
        changed = true;
        return { ...m, playedA: r.entryA, playedB: r.entryB };
      }
      if (m.playedA === r.entryA && m.playedB === r.entryB) return m;
      changed = true;
      return { ...m, scoreA: undefined, scoreB: undefined, playedA: undefined, playedB: undefined };
    });
    if (!changed) break;
    bracket = next;
  }
  return bracket;
}

/** True once every playable KO match has a result (bye matches never get one). */
export function isBracketComplete(bracket: BracketMatch[]): boolean {
  if (bracket.length === 0) return false;
  return bracket.every((m) => {
    const isBye = m.slotA.kind === "bye" || m.slotB.kind === "bye";
    return isBye || (m.scoreA != null && m.scoreB != null);
  });
}

/** Bring every derived structure in line with the tournament; identity-preserving. */
export function syncStructures(t: Tournament): Tournament {
  if (t.format === "rotation") return t;
  let next = t;
  if (usesGroups(t) && t.entries.length >= 2 && t.groupAssignment.length !== t.groupCount) {
    const { groups } = assignGroups(t.entries, t.groupCount);
    next = { ...next, groupAssignment: groups.map((g) => g.map((e) => e.id)) };
  }
  const groupSchedule = syncGroupSchedule(next);
  if (groupSchedule !== next.groupSchedule) next = { ...next, groupSchedule };
  const bracket = syncBracket(next);
  if (bracket !== next.bracket) next = { ...next, bracket };
  return next;
}
