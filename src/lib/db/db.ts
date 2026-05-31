import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Tournament } from "../../types.ts";

// The app persists a single, current tournament. It lives in the `tournaments`
// store under a fixed key (out-of-line keys, since Tournament has no own id).
export interface AppSchema extends DBSchema {
  tournaments: { key: string; value: Tournament };
}

export const TOURNAMENTS_STORE = "tournaments";
export const CURRENT_KEY = "current";

const DB_NAME = "tennisturnier";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<AppSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TOURNAMENTS_STORE)) {
          db.createObjectStore(TOURNAMENTS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/** Test helper: wipe all stores in the current DB. */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Array.from(db.objectStoreNames), "readwrite");
  await Promise.all(Array.from(db.objectStoreNames).map((name) => tx.objectStore(name).clear()));
  await tx.done;
  notifyMutation("*");
}

/** Notify subscribers of mutations. Channels are per-store. */
export function notifyMutation(storeName: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(`db:${storeName}`);
  channel.postMessage({ type: "mutation", at: Date.now() });
  channel.close();
}
