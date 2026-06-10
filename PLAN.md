# Deep-Fixup-Plan — 2026-06-10

Session-Plan für den Deep-Fixup auf Branch `claude/deep-fixup-bdor98`.
Analyse-Ergebnis: Repo ist gesund (Build/Tests/Lint/Typecheck grün) — der Plan
ist bewusst kurz und behebt nur verifizierte Probleme.

## Baseline (Session-Start, alles grün)
- `bun run build` ✓ · `bun run test` ✓ 87/87 (9 Dateien)
- `bun run lint` ✓ exit 0 — 27 Warnungen (24× `noNonNullAssertion` bewusst auf
  warn, 5× `useExhaustiveDependencies`, 1× unused suppression) + 1 Info
  (biome.json-Schema 2.4.15 vs. CLI 2.4.16)
- `bun run typecheck` ✓

**Voll-Verifikation:** `bun run build && bun run test && bun run lint && bun run typecheck`

## Tasks

- [x] T1: Sanitize scalar/enum fields in `migrate()`
      Files: src/storage.ts:63-86, src/__tests__/storage.test.ts
      Change: Nach dem `...base, ...p`-Spread validierte Overrides ergänzen
      (gleiches Muster wie bestehende Array/Boolean/bellVariant-Behandlung):
      `name` (string, sonst base), `format` ∈ {"rotation","groups","knockout","groups-ko"},
      `mode` ∈ {"mixed","women","men","open"}, `entryFormat` ∈ {"singles","doubles"},
      numerische Clamps identisch zu den useTournament-Settern:
      courts 1–20, rounds 1–50, timerMinutes 1–120, groupCount 1–8,
      advancePerGroup 1–4 (nicht-endlich/kein number → Default; runden).
      Helper `clampInt(v, min, max, fallback)` in storage.ts.
      Tests: courts:"invalid"→2, rounds:NaN→5, format:"bogus"→"rotation",
      mode:42→"mixed", timerMinutes:9999→120.
      Verify: bun run test && bun run typecheck

- [x] T2: Run remote sync snapshots through `migrate()`
      Files: src/App.tsx:83-87
      Change: `const applyRemote = useCallback((next: Tournament) =>
      replaceTournament(migrate(next)), [replaceTournament])` vor dem
      useSync-Aufruf (memoisiert, da applyRemote im Poll-Effect-Dep-Array liegt);
      `applyRemote` an useSync übergeben. `migrate` ist bereits importiert,
      `sanitizeSync` erhält den Viewer-Sync-Zustand.
      Verify: bun run test && bun run typecheck && bun run lint

- [x] T3: Add an error boundary with reload fallback
      Files: src/components/ErrorBoundary.tsx (neu), src/main.tsx,
             src/i18n/de.ts, src/i18n/en.ts
      Change: Klassen-Boundary (componentDidCatch → console.error); Fallback ist
      eine Funktionskomponente mit useTranslation (useLocale braucht keinen
      Provider): Titel + Beschreibung + Reload-Button
      (`window.location.reload()`), zentriert wie der Hydration-Spinner
      (App.tsx:337-343). In main.tsx um `<RouterProvider/>` legen.
      Neue Keys in BEIDEN Locales: errorBoundary.title, errorBoundary.description,
      errorBoundary.reload (i18n.test.ts prüft Key-Parität).
      Verify: bun run build && bun run test && bun run lint

- [ ] T4: Memoize `doPush` and fix useSync effect dependencies
      Files: src/hooks/useSync.ts:74-158, 240, 288
      Change: `doPush` in `useCallback` mit Deps `[sync?.shareCode, sync?.ownerToken]`
      (Rest sind Refs/stabile Setter); die beiden Owner-Effect-Dep-Arrays korrekt
      machen (ganzes `sync`-Objekt raus, shareCode/ownerToken + doPush rein);
      tote `eslint-disable-next-line`-Kommentare entfernen; wo eine Suppression
      wirklich gewollt ist, `// biome-ignore lint/correctness/useExhaustiveDependencies: <Grund>`.
      Verhalten unverändert: Debounce-Push, In-Flight-Guard, Catch-up-Push,
      Online-Flush, Poll-Loop.
      Verify: bun run test && bun run lint (useSync-Warnungen weg) && bun run typecheck

- [ ] T5: Lint hygiene batch — schema bump, App.tsx deps, dead suppressions, dead export
      Files: biome.json:2; src/App.tsx:125-130, 183-184, 186-218, 234-235;
             src/components/RoundTimer.tsx:40; src/lib/db/useLiveQuery.ts:26;
             src/knockoutScheduler.ts:248
      Change: biome.json-$schema auf 2.4.16. App.tsx: `setPhase` in Deps des
      Re-Default-Effects (125); handleGenerate-Deps fixen (186); `handleReset`
      in useCallback + handleNewTournament-Deps (235); tote eslint-disable-
      Kommentare (183/234, RoundTimer.tsx:40) entfernen. Unused suppression in
      useLiveQuery.ts:26 entfernen. Toten Export `bracketNewId`
      (knockoutScheduler.ts:248) löschen.
      Verify: bun run lint → nur noch die bewussten noNonNullAssertion-Warnungen,
      keine Info; bun run test && bun run typecheck

- [ ] T6: Sync README to reality (Biome, typecheck script)
      Files: README.md:63, 69
      Change: Scripts-Tabelle — lint-Zeile → "Biome (Lint + Format-Check)";
      Zeile `bun run typecheck` → "TypeScript-Typprüfung (tsc -b --noEmit)"
      ergänzen; Tech-Stack-Zeile: "ESLint 9" → "Biome 2".
      Verify: grep -i eslint README.md → keine Treffer; bun run lint

- [ ] T7: Final full verification + check off PLAN.md
      Verify: bun run build && bun run test && bun run lint && bun run typecheck

## Nicht in dieser Session
- Client-seitiges `baseVersion`/409-Handling: mit dem Single-Owner-Device-Modell
  kein konstruierbarer Fehlerfall (ownerToken verlässt das Erstell-Gerät nie).
- Tiefen-Validierung der players/schedule/bracket-Array-Items in `migrate()`
  (Skalar/Enum-Härtung deckt alle demonstrierten Fehlerbilder ab).
- Die 24 `noNonNullAssertion`-Warnungen — Regel bewusst auf "warn".
- Render-Tests für Komponenten/Hooks (keine testing-library installiert).
