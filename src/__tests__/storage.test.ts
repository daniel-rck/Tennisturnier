import { describe, expect, it } from "vitest";
import { defaultTournament, migrate } from "../storage";

describe("migrate", () => {
  it("returns defaults for null/undefined/string input", () => {
    expect(migrate(null)).toEqual(defaultTournament());
    expect(migrate(undefined)).toEqual(defaultTournament());
    expect(migrate("garbage")).toEqual(defaultTournament());
  });

  it("migrates a v1 tournament without groupAssignment", () => {
    const v1 = {
      name: "Old",
      format: "rotation",
      courts: 3,
      rounds: 4,
      mode: "mixed",
      timerMinutes: 20,
      players: [{ id: "p1", name: "A", gender: "F" }],
      schedule: [],
      entryFormat: "doubles",
      entries: [],
      groupCount: 2,
      advancePerGroup: 2,
      groupSchedule: [],
      bracket: [],
    };
    const migrated = migrate(v1);
    expect(migrated.groupAssignment).toEqual([]);
    expect(migrated.thirdPlaceMatch).toBe(false);
    expect(migrated.players).toHaveLength(1);
    expect(migrated.courts).toBe(3);
  });

  it("drops malformed entries (missing id)", () => {
    const v1 = {
      entries: [{ id: "a", name: "A", members: ["x"] }, { name: "no-id", members: ["x"] }, null],
    };
    const migrated = migrate(v1);
    expect(migrated.entries).toHaveLength(1);
    expect(migrated.entries[0].id).toBe("a");
  });

  it("falls back to defaults for invalid scalar types", () => {
    const corrupt = {
      name: 7,
      format: "bogus",
      mode: 42,
      entryFormat: null,
      courts: "invalid",
      rounds: Number.NaN,
      timerMinutes: 9999,
      groupCount: -3,
      advancePerGroup: "2",
    };
    const migrated = migrate(corrupt);
    expect(migrated.name).toBe("Vereinsturnier");
    expect(migrated.format).toBe("rotation");
    expect(migrated.mode).toBe("mixed");
    expect(migrated.entryFormat).toBe("doubles");
    expect(migrated.courts).toBe(2);
    expect(migrated.rounds).toBe(5);
    expect(migrated.timerMinutes).toBe(120);
    expect(migrated.groupCount).toBe(1);
    expect(migrated.advancePerGroup).toBe(2);
  });

  it("rounds and keeps valid numeric scalars", () => {
    const migrated = migrate({ courts: 3.4, rounds: 12, timerMinutes: 25 });
    expect(migrated.courts).toBe(3);
    expect(migrated.rounds).toBe(12);
    expect(migrated.timerMinutes).toBe(25);
  });

  it("fills missing members[] with empty array", () => {
    const v1 = {
      entries: [{ id: "a", name: "A" }],
    };
    const migrated = migrate(v1);
    expect(migrated.entries[0].members).toEqual([]);
  });
});
