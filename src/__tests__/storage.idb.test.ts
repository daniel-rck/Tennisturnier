import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearAll } from "../lib/db/index.ts";
import {
  defaultTournament,
  loadTournament,
  migrateFromLocalStorage,
  saveTournament,
} from "../storage.ts";

const KEY_V2 = "tennisturnier:v2";
const KEY_V1 = "tennisturnier:v1";

// Minimal in-memory localStorage so the legacy-migration path can be tested
// without a full DOM environment.
function makeLocalStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

beforeEach(async () => {
  globalThis.localStorage = makeLocalStorage();
  await clearAll();
});

afterEach(() => {
  globalThis.localStorage.clear();
});

describe("idb persistence", () => {
  it("returns defaults when nothing is stored", async () => {
    expect(await loadTournament()).toEqual(defaultTournament());
  });

  it("round-trips a saved tournament through idb", async () => {
    const t = defaultTournament();
    t.name = "Roundtrip Cup";
    t.courts = 4;
    await saveTournament(t);
    const loaded = await loadTournament();
    expect(loaded.name).toBe("Roundtrip Cup");
    expect(loaded.courts).toBe(4);
  });
});

describe("migrateFromLocalStorage", () => {
  it("moves a legacy v2 payload into idb and clears the legacy keys", async () => {
    localStorage.setItem(KEY_V2, JSON.stringify({ name: "Legacy", courts: 3 }));
    await migrateFromLocalStorage();

    const loaded = await loadTournament();
    expect(loaded.name).toBe("Legacy");
    expect(loaded.courts).toBe(3);
    expect(localStorage.getItem(KEY_V2)).toBeNull();
    expect(localStorage.getItem(KEY_V1)).toBeNull();
  });

  it("falls back to the v1 key when no v2 payload exists", async () => {
    localStorage.setItem(KEY_V1, JSON.stringify({ name: "Ancient" }));
    await migrateFromLocalStorage();
    expect((await loadTournament()).name).toBe("Ancient");
  });

  it("is a no-op when idb already holds a tournament (no overwrite)", async () => {
    const existing = defaultTournament();
    existing.name = "Already Here";
    await saveTournament(existing);

    localStorage.setItem(KEY_V2, JSON.stringify({ name: "Should Not Win" }));
    await migrateFromLocalStorage();

    expect((await loadTournament()).name).toBe("Already Here");
    // Legacy key is left untouched since migration did not run.
    expect(localStorage.getItem(KEY_V2)).not.toBeNull();
  });

  it("does nothing when there is no legacy data", async () => {
    await migrateFromLocalStorage();
    expect(await loadTournament()).toEqual(defaultTournament());
  });
});
