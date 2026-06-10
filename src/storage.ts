import { CURRENT_KEY, getDB, notifyMutation, TOURNAMENTS_STORE } from "./lib/db/index.ts";
import type { BellVariant, Entry, RevealState, Tournament } from "./types";

const BELL_VARIANTS: readonly BellVariant[] = ["classic", "boxing", "alarm", "temple"];
const FORMATS: readonly Tournament["format"][] = ["rotation", "groups", "knockout", "groups-ko"];
const MODES: readonly Tournament["mode"][] = ["mixed", "women", "men", "open"];
const ENTRY_FORMATS: readonly Tournament["entryFormat"][] = ["singles", "doubles"];

/** Clamp to an integer in [min, max]; non-numeric/non-finite input → fallback. */
const clampInt = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(min, Math.min(max, Math.round(v)))
    : fallback;

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

// Legacy localStorage keys — read once during migration into idb, then removed.
const KEY_V1 = "tennisturnier:v1";
const KEY = "tennisturnier:v2";

export const defaultReveal = (): RevealState => ({
  active: false,
  steps: { overall: 0, women: 0, men: 0 },
});

export const defaultTournament = (): Tournament => ({
  name: "Vereinsturnier",
  format: "rotation",
  courts: 2,
  rounds: 5,
  mode: "mixed",
  timerMinutes: 15,
  bellVariant: "classic",
  players: [],
  schedule: [],
  allowPartialFinalRound: true,
  entryFormat: "doubles",
  entries: [],
  groupCount: 2,
  advancePerGroup: 2,
  groupSchedule: [],
  bracket: [],
  groupAssignment: [],
  thirdPlaceMatch: false,
  perGenderRanking: false,
  reveal: defaultReveal(),
});

/** Migrate a partial / older tournament shape onto current defaults. Defensive — never throws. */
export function migrate(parsed: unknown): Tournament {
  const base = defaultTournament();
  if (!parsed || typeof parsed !== "object") return base;
  const p = parsed as Partial<Tournament> & { entries?: unknown };

  // Sanitize entries: every entry must have id, name, members[]
  const entries: Entry[] = Array.isArray(p.entries)
    ? p.entries.flatMap((e) => {
        if (!e || typeof e !== "object") return [];
        const o = e as Partial<Entry>;
        if (typeof o.id !== "string") return [];
        const members = Array.isArray(o.members)
          ? o.members.filter((m): m is string => typeof m === "string")
          : [];
        return [
          {
            id: o.id,
            name: typeof o.name === "string" ? o.name : members.join(" & "),
            members,
          },
        ];
      })
    : [];

  return {
    ...base,
    ...p,
    entries,
    name: typeof p.name === "string" ? p.name : base.name,
    format: oneOf(p.format, FORMATS, base.format),
    mode: oneOf(p.mode, MODES, base.mode),
    entryFormat: oneOf(p.entryFormat, ENTRY_FORMATS, base.entryFormat),
    // Same ranges the useTournament setters enforce.
    courts: clampInt(p.courts, 1, 20, base.courts),
    rounds: clampInt(p.rounds, 1, 50, base.rounds),
    timerMinutes: clampInt(p.timerMinutes, 1, 120, base.timerMinutes),
    groupCount: clampInt(p.groupCount, 1, 8, base.groupCount),
    advancePerGroup: clampInt(p.advancePerGroup, 1, 4, base.advancePerGroup),
    players: Array.isArray(p.players) ? p.players : [],
    schedule: Array.isArray(p.schedule) ? p.schedule : [],
    groupSchedule: Array.isArray(p.groupSchedule) ? p.groupSchedule : [],
    bracket: Array.isArray(p.bracket) ? p.bracket : [],
    groupAssignment: Array.isArray(p.groupAssignment) ? p.groupAssignment : [],
    thirdPlaceMatch: typeof p.thirdPlaceMatch === "boolean" ? p.thirdPlaceMatch : false,
    perGenderRanking: typeof p.perGenderRanking === "boolean" ? p.perGenderRanking : false,
    allowPartialFinalRound:
      typeof p.allowPartialFinalRound === "boolean"
        ? p.allowPartialFinalRound
        : base.allowPartialFinalRound,
    bellVariant:
      typeof p.bellVariant === "string" &&
      (BELL_VARIANTS as readonly string[]).includes(p.bellVariant)
        ? (p.bellVariant as BellVariant)
        : base.bellVariant,
    reveal: sanitizeReveal(p.reveal),
    sync: sanitizeSync(p.sync),
  };
}

function sanitizeReveal(input: unknown): RevealState {
  const base = defaultReveal();
  if (!input || typeof input !== "object") return base;
  const r = input as Partial<RevealState>;
  const stepIn = r.steps && typeof r.steps === "object" ? (r.steps as Record<string, unknown>) : {};
  const clamp = (v: unknown): 0 | 1 | 2 | 3 => {
    const n = typeof v === "number" ? Math.round(v) : 0;
    return n === 1 || n === 2 || n === 3 ? n : 0;
  };
  return {
    active: typeof r.active === "boolean" ? r.active : false,
    steps: {
      overall: clamp(stepIn.overall),
      women: clamp(stepIn.women),
      men: clamp(stepIn.men),
    },
  };
}

function sanitizeSync(input: unknown): Tournament["sync"] {
  if (!input || typeof input !== "object") return undefined;
  const s = input as { shareCode?: unknown; ownerToken?: unknown; enabled?: unknown };
  if (typeof s.shareCode !== "string" || s.shareCode.length === 0) return undefined;
  return {
    shareCode: s.shareCode,
    ownerToken: typeof s.ownerToken === "string" ? s.ownerToken : undefined,
    enabled: typeof s.enabled === "boolean" ? s.enabled : false,
  };
}

/**
 * Read the legacy localStorage payload (v2, falling back to v1), if any.
 * Returns the raw JSON string or null. Never throws.
 */
function readLegacyRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? localStorage.getItem(KEY_V1);
  } catch {
    return null;
  }
}

/**
 * One-time migration of pre-idb data: if idb has no tournament yet but a legacy
 * localStorage payload exists, migrate it into idb and remove the legacy keys.
 * Conservative — on any error it aborts and leaves localStorage untouched so a
 * later start can retry. Idempotent: a no-op once idb holds a tournament.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.get(TOURNAMENTS_STORE, CURRENT_KEY);
    if (existing) return;
    const raw = readLegacyRaw();
    if (!raw) return;
    const migrated = migrate(JSON.parse(raw));
    await db.put(TOURNAMENTS_STORE, migrated, CURRENT_KEY);
    // Only drop the legacy keys after the idb write succeeded.
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_V1);
    } catch {
      /* ignore */
    }
  } catch {
    // Abort silently — leave any legacy data intact for a later retry.
  }
}

export async function loadTournament(): Promise<Tournament> {
  try {
    const db = await getDB();
    const stored = await db.get(TOURNAMENTS_STORE, CURRENT_KEY);
    // migrate() is idempotent — also normalizes any older shape read from idb.
    return stored ? migrate(stored) : defaultTournament();
  } catch {
    return defaultTournament();
  }
}

export async function saveTournament(t: Tournament): Promise<void> {
  try {
    const db = await getDB();
    await db.put(TOURNAMENTS_STORE, t, CURRENT_KEY);
    notifyMutation(TOURNAMENTS_STORE);
  } catch {
    // ignore write errors — non-critical
  }
}
