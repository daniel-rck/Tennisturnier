import type { DBSchema } from "idb";
import type { Tournament } from "../../types.ts";
import { clearStores } from "./mutations.ts";
import { createDBOpener } from "./open.ts";

// The app persists a single, current tournament. It lives in the `tournaments`
// store under a fixed key (out-of-line keys, since Tournament has no own id).
export interface AppSchema extends DBSchema {
  tournaments: { key: string; value: Tournament };
}

export const TOURNAMENTS_STORE = "tournaments";
export const CURRENT_KEY = "current";

export const getDB = createDBOpener<AppSchema>({
  // Never rename: a new name starts every user with an empty database.
  name: "tennisturnier",
  version: 1,
  upgrade(db) {
    // v1 — the shipped step, unchanged. A schema change bumps `version` and
    // adds an `if (oldVersion < N)` step below; never edit this one.
    if (!db.objectStoreNames.contains(TOURNAMENTS_STORE)) {
      db.createObjectStore(TOURNAMENTS_STORE);
    }
  },
});

/** Wipe every store (tests' `beforeEach`, a "delete all data" action). */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}

export { notifyMutation } from "./mutations.ts";
