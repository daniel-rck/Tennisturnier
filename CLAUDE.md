# Claude-Code-Hinweise für Tennisturnier

Browserbasierte App zum Planen kleiner Tennisturniere: Spielplan, Rundentimer,
Gruppen, KO-Bracket, Ergebnis-Eingabe, Siegerehrung. Offlinefähig, ohne Anmeldung.

## Quelle der Wahrheit

1. **`docs/specs/`** — App-Architektur und Entscheidungen (u. a. `sync.md`).
   Vor jeder Arbeit lesen; bei Designänderungen im selben Change aktualisieren.
2. **Foundation [`daniel-rck/web-base`](https://github.com/daniel-rck/web-base)**
   — Stack, Layout-System, Storage-/PWA-/Router-/CI-Konventionen. Bei
   ungeklärten Entscheidungen die minimale, zu den bestehenden Mustern passende
   Variante wählen. Scaffolding & Updates über die CLI
   (`bunx github:daniel-rck/web-base …`), nicht von Hand kopieren.

## Quality Gates

Vor jedem Commit grün halten:

```bash
bun run lint        # oxlint + oxfmt --check
bun run typecheck   # tsc (App + SW + Worker + functions)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **oxlint + oxfmt** für Lint + Format. Geteilte Regeln in `oxlint.base.json`
  und `.oxfmtrc.json` (zentral verwaltet, nicht anfassen), App-Ausnahmen in
  `.oxlintrc.json` → `overrides` bzw. Format-Ausschlüsse in `.prettierignore`.
  Unterdrückungen als `// oxlint-disable-next-line <rule> -- <Grund>`.
- **TypeScript 7 strict** inkl. `noUncheckedIndexedAccess`;
  `verbatimModuleSyntax` (→ `import type`); `type` statt `interface`.
- **Deutsche UI + README, englischer Quellcode** (Bezeichner, Kommentare,
  Commits, `docs/specs/`).
- **App-Daten in IndexedDB** (`src/lib/db/`), `localStorage` nur für Settings.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## App-spezifische Leitplanken

- **`src/utils/at.ts` statt `!` bei Index-Zugriffen.** Die Scheduling- und
  Ranking-Algorithmen lesen viel über bewiesen gültige Indizes (Schleifen mit
  `i < arr.length`, Zugriffe nach einem Längen-Check). `noUncheckedIndexedAccess`
  sieht diesen Beweis nicht. `at()` behält eine echte Laufzeitprüfung und wirft
  laut, wenn eine Annahme kippt — ein `!` würde die Prüfung ersatzlos streichen.
- **Akzent ist `--accent-h: 175`** (Smaragd — Tennisplatz), seit web-base 0.6.0
  mit ≥ 25° Abstand zu `success` (150). `theme_color` ist `#007e5a`
  (accent-600) in `vite.config.ts` und `index.html`. Die Tokens kommen aus
  dem owned `src/lib/ui/tokens.css`; `theme.css` setzt nur den Hue, die
  App-Aliase (`brand`, `court`, Medaillen …) stehen in `src/index.css`.
- **Theme**: Persistenz, der `data-theme`-Vertrag und der seitenweite Store
  kommen aus `src/lib/ui/useTheme.ts` (web-base). `src/hooks/useTheme.ts` ist
  nur ein dünner Wrapper, der `cycle()` und den `theme-color`-Meta-Sync
  ergänzt (hell `#007e5a`, dunkel `#051410`). Der alte App-Key
  `tennisturnier:theme` wird in `public/theme-init.js` einmalig nach `theme`
  migriert — nicht entfernen, solange Nutzer mit altem State existieren.
- **i18n**: alle UI-Strings über `useTranslation()` / `TranslationKey`. Deshalb
  hat die App einen eigenen `ThemeToggle` (über den `themeToggle`-Slot der
  `AppShell`) und ein eigenes `src/components/UpdatePrompt.tsx` über web-bases
  `useAppUpdate()` statt der deutschen Varianten aus web-base. Owned Dateien
  werden dafür nicht geforkt: `RouteError`, `NotFound`, `OfflineIndicator` und
  der Skip-Link der `AppShell` sind nur deutsch (Follow-up für web-base).
- **Router**: `<App/>` ist die Root-Layout-Route (`src/lib/router.tsx`) und
  hält Shell + Turnier-State. Die Phase kommt aus dem `handle` der passenden
  Kind-Route (`/`, `/live`, `/ergebnis`); unbekannte Pfade rendern `NotFound`
  über das `<Outlet/>` in der Shell (vorher Redirect auf `/`).
- **Worker**: `worker/index.ts` delegiert an `routeRequest()` aus dem owned
  `worker/base.ts`; `handleApi()` routet nur `/api/sync*` an `functions/`.
- **Der KV-Binding-Name `TOURNAMENTS`** ist in `functions/_shared/kv.ts`
  fest verdrahtet. In `wrangler.toml` nicht umbenennen.

## Bewusste Abweichungen

- **KV-only-Sync statt des `sync`-Templates.** Turnierdaten werden bewusst per
  Share-Code geteilt und sind nicht im selben Sinn schützenswert wie die
  E2E-verschlüsselten Daten anderer Apps. Dokumentiert in `docs/specs/sync.md`.
- **Eigener `ThemeToggle` und `UpdatePrompt`** wegen i18n (siehe oben); Hook
  bzw. `useAppUpdate()` sind die geteilten.
- **Eigene `vitest.config.ts`** statt der Template-Variante, die die
  `vite.config.ts` merged: die Tests sind reine Logik und brauchen die
  React-/Tailwind-/PWA-Plugins nicht. Sie lädt aber `src/test/setup.ts` (jsdom).
- **`web-base pins` meldet „ahead"**: React 19.3, Vite 8.3, Vitest 5 u. a.
  liegen über der Pin-Tabelle. Nicht per `pins --apply` absenken — Vitest 5 → 4
  wäre ein Major-Downgrade.
