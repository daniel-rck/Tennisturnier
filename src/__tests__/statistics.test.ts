import { describe, expect, it } from "vitest";
import { computePlayerStats } from "../statistics";
import type { Match, Player, Round, Tournament } from "../types";

const player = (id: string, name: string, gender: "F" | "M" = "M"): Player => ({
  id,
  name,
  gender,
});

const baseTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  name: "Test",
  format: "rotation",
  courts: 2,
  rounds: 4,
  mode: "mixed",
  timerMinutes: 15,
  bellVariant: "classic",
  players: [],
  schedule: [],
  allowPartialFinalRound: false,
  entryFormat: "doubles",
  entries: [],
  groupCount: 2,
  advancePerGroup: 2,
  groupSchedule: [],
  bracket: [],
  groupAssignment: [],
  thirdPlaceMatch: false,
  perGenderRanking: false,
  reveal: { active: false, steps: { overall: 0, women: 0, men: 0 } },
  ...overrides,
});

const match = (
  court: number,
  a: [string, string],
  b: [string, string],
  scoreA?: number,
  scoreB?: number,
): Match => ({
  court,
  teamA: { players: a },
  teamB: { players: b },
  scoreA,
  scoreB,
});

const round = (index: number, matches: Match[], resting: string[] = []): Round => ({
  index,
  matches,
  resting,
});

describe("computePlayerStats — rotation", () => {
  it("returns empty list when there are no recorded results", () => {
    const t = baseTournament({
      players: [player("a", "Anna"), player("b", "Bob"), player("c", "Cara"), player("d", "Dan")],
      schedule: [round(1, [match(1, ["a", "b"], ["c", "d"])])],
    });
    expect(computePlayerStats(t)).toEqual([]);
  });

  it("aggregates wins, draws, losses, games and diff per player", () => {
    const t = baseTournament({
      players: [player("a", "Anna"), player("b", "Bob"), player("c", "Cara"), player("d", "Dan")],
      schedule: [
        round(1, [match(1, ["a", "b"], ["c", "d"], 6, 3)]),
        round(2, [match(1, ["a", "c"], ["b", "d"], 5, 5)]),
        round(3, [match(1, ["a", "d"], ["b", "c"], 2, 7)]),
      ],
    });
    const stats = computePlayerStats(t);
    const byId = new Map(stats.map((s) => [s.playerId, s]));

    const anna = byId.get("a")!;
    expect(anna.played).toBe(3);
    expect(anna.wins).toBe(1);
    expect(anna.draws).toBe(1);
    expect(anna.losses).toBe(1);
    expect(anna.gamesFor).toBe(6 + 5 + 2);
    expect(anna.gamesAgainst).toBe(3 + 5 + 7);
    expect(anna.diff).toBe(anna.gamesFor - anna.gamesAgainst);
    expect(anna.winRate).toBeCloseTo(1 / 3, 5);

    const bob = byId.get("b")!;
    expect(bob.played).toBe(3);
    expect(bob.wins).toBe(2);
    expect(bob.draws).toBe(1);
    expect(bob.losses).toBe(0);
  });

  it("ignores matches with missing scores", () => {
    const t = baseTournament({
      players: [player("a", "Anna"), player("b", "Bob"), player("c", "Cara"), player("d", "Dan")],
      schedule: [
        round(1, [match(1, ["a", "b"], ["c", "d"], 6, 3), match(2, ["a", "c"], ["b", "d"])]),
      ],
    });
    const stats = computePlayerStats(t);
    expect(stats.find((s) => s.playerId === "a")?.played).toBe(1);
  });

  it("identifies the best partner correctly", () => {
    const t = baseTournament({
      players: [player("a", "Anna"), player("b", "Bob"), player("c", "Cara"), player("d", "Dan")],
      schedule: [
        round(1, [match(1, ["a", "b"], ["c", "d"], 6, 0)]),
        round(2, [match(1, ["a", "b"], ["c", "d"], 6, 1)]),
        round(3, [match(1, ["a", "c"], ["b", "d"], 0, 6)]),
      ],
    });
    const stats = computePlayerStats(t);
    const anna = stats.find((s) => s.playerId === "a")!;
    expect(anna.bestPartner?.id).toBe("b");
    expect(anna.bestPartner?.wins).toBe(2);
    expect(anna.bestPartner?.played).toBe(2);
  });

  it("sorts by win rate desc, then diff", () => {
    const t = baseTournament({
      players: [player("a", "Anna"), player("b", "Bob"), player("c", "Cara"), player("d", "Dan")],
      schedule: [
        round(1, [match(1, ["a", "b"], ["c", "d"], 6, 0)]),
        round(2, [match(1, ["a", "b"], ["c", "d"], 6, 0)]),
      ],
    });
    const stats = computePlayerStats(t);
    expect(stats[0].winRate).toBe(1);
    expect(stats[stats.length - 1].winRate).toBe(0);
  });
});

describe("computePlayerStats — groups + bracket", () => {
  it("aggregates results from groupSchedule via entry members", () => {
    const t = baseTournament({
      format: "groups",
      entries: [
        { id: "e1", name: "Pair One", members: ["Anna", "Bob"] },
        { id: "e2", name: "Pair Two", members: ["Cara", "Dan"] },
      ],
      groupSchedule: [
        {
          group: 1,
          matchIndex: 0,
          entryA: "e1",
          entryB: "e2",
          scoreA: 6,
          scoreB: 3,
        },
      ],
    });
    const stats = computePlayerStats(t);
    const byName = new Map(stats.map((s) => [s.name, s]));
    expect(byName.get("Anna")?.wins).toBe(1);
    expect(byName.get("Bob")?.wins).toBe(1);
    expect(byName.get("Cara")?.losses).toBe(1);
    expect(byName.get("Dan")?.losses).toBe(1);
    expect(byName.get("Anna")?.bestPartner?.name).toBe("Bob");
  });

  it("skips bracket matches whose slots are not resolved entries", () => {
    const t = baseTournament({
      format: "knockout",
      entries: [
        { id: "e1", name: "A", members: ["Anna", "Bob"] },
        { id: "e2", name: "B", members: ["Cara", "Dan"] },
      ],
      bracket: [
        {
          matchId: "F",
          round: 1,
          position: 0,
          slotA: { kind: "entry", entryId: "e1" },
          slotB: { kind: "feeder", matchId: "SF1" },
          scoreA: 6,
          scoreB: 3,
        },
      ],
    });
    expect(computePlayerStats(t)).toEqual([]);
  });
});
