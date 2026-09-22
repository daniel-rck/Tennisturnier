import { describe, expect, it } from "vitest";
import { resolveBracket } from "../knockoutScheduler";
import { defaultTournament } from "../storage";
import { groupRankLookup, isBracketComplete, syncStructures } from "../structure";
import type { BracketMatch, Entry, Format, Tournament } from "../types";

const entries = (...names: string[]): Entry[] =>
  names.map((n) => ({ id: n, name: n, members: [n] }));

const make = (format: Format, names: string[]): Tournament =>
  syncStructures({ ...defaultTournament(), format, entries: entries(...names) });

const score = (t: Tournament, matchId: string, a: number, b: number): Tournament =>
  syncStructures({
    ...t,
    bracket: t.bracket.map((m) => (m.matchId === matchId ? { ...m, scoreA: a, scoreB: b } : m)),
  });

const find = (bracket: BracketMatch[], id: string) => {
  const m = bracket.find((x) => x.matchId === id);
  if (!m) throw new Error(`missing ${id}`);
  return m;
};

describe("syncStructures", () => {
  it("builds the bracket without any panel mounted", () => {
    const t = make("knockout", ["a", "b", "c", "d"]);
    expect(t.bracket.map((m) => m.matchId)).toEqual(["R1-M1", "R1-M2", "F"]);
  });

  it("builds group assignment and schedule for groups", () => {
    const t = make("groups", ["a", "b", "c", "d"]);
    expect(t.groupAssignment).toHaveLength(t.groupCount);
    expect(t.groupSchedule.length).toBeGreaterThan(0);
  });

  it("returns the same object when nothing changed", () => {
    const t = make("groups-ko", ["a", "b", "c", "d", "e", "f"]);
    expect(syncStructures(t)).toBe(t);
    const r = { ...defaultTournament(), format: "rotation" as const };
    expect(syncStructures(r)).toBe(r);
  });

  it("clears downstream scores when an earlier result flips", () => {
    let t = make("knockout", ["a", "b", "c", "d"]);
    t = score(t, "R1-M1", 6, 3); // a beats d
    t = score(t, "R1-M2", 6, 2); // b beats c
    t = score(t, "F", 6, 4); // a beats b
    expect(find(t.bracket, "F")).toMatchObject({ scoreA: 6, playedA: "a", playedB: "b" });

    t = score(t, "R1-M1", 3, 6); // correction: d beats a
    const final = find(t.bracket, "F");
    expect(final.scoreA).toBeUndefined();
    expect(final.scoreB).toBeUndefined();
    const resolved = resolveBracket(t.bracket, (id) => id);
    expect(resolved.find((r) => r.matchId === "F")).toMatchObject({ entryA: "d", entryB: "b" });
  });

  it("keeps downstream scores when the correction keeps the winner", () => {
    let t = make("knockout", ["a", "b", "c", "d"]);
    t = score(t, "R1-M1", 6, 3);
    t = score(t, "R1-M2", 6, 2);
    t = score(t, "F", 6, 4);
    t = score(t, "R1-M1", 7, 5);
    expect(find(t.bracket, "F").scoreA).toBe(6);
  });
});

describe("isBracketComplete", () => {
  it("ignores bye matches", () => {
    let t = make("knockout", ["a", "b", "c"]);
    // 3 entries -> R1-M1 a vs bye, R1-M2 b vs c, F
    t = score(t, "R1-M2", 6, 1);
    expect(isBracketComplete(t.bracket)).toBe(false);
    t = score(t, "F", 6, 2);
    expect(isBracketComplete(t.bracket)).toBe(true);
  });
});

describe("groupRankLookup", () => {
  it("resolves a group's ranks only once all its matches are scored", () => {
    let t = make("groups-ko", ["a", "b", "c", "d"]);
    t = { ...t, groupCount: 1, advancePerGroup: 2, groupAssignment: [] };
    t = syncStructures(t);
    expect(groupRankLookup(t)?.(1, 1)).toBeUndefined();
    const scored = t.groupSchedule.map((m, i) => ({
      ...m,
      scoreA: i === t.groupSchedule.length - 1 ? undefined : 6,
      scoreB: 2,
    }));
    t = syncStructures({ ...t, groupSchedule: scored });
    expect(groupRankLookup(t)?.(1, 1)).toBeUndefined();
    t = syncStructures({
      ...t,
      groupSchedule: t.groupSchedule.map((m) => ({ ...m, scoreA: m.scoreA ?? 6 })),
    });
    expect(groupRankLookup(t)?.(1, 1)).toBeDefined();
  });
});

describe("isBracketComplete — ties", () => {
  it("does not count a tied final as decided", () => {
    let t = make("knockout", ["a", "b"]);
    t = score(t, "R1-M1", 6, 6);
    expect(isBracketComplete(t.bracket)).toBe(false);
  });
});
