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
bun run lint        # Biome (check)
bun run typecheck   # tsc (App + SW + Worker + functions)
bun run test        # Vitest
bun run build       # SPA + PWA
```

## Konventionen (gemäß web-base)

- **Bun** als Runtime & Package-Manager (kein npm/yarn-Lockfile).
- **Biome** für Lint + Format. Geteilte Regeln in `biome.base.json` (zentral
  verwaltet, nicht anfassen), App-Ausnahmen in `biome.json` → `overrides`.
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
- **Akzent ist `--accent-h: 155`** (Emerald — Tennisplatz). Achtung: das liegt
  nur 5° neben `--color-success` (150); ein `Badge variant="success"` und ein
  Accent-Chip sind hier schwer zu unterscheiden. Als Follow-up in web-bases
  `04-layout-system.md` notiert.
- **Theme**: Persistenz und der `data-theme`-Vertrag kommen aus
  `src/lib/ui/useTheme.ts` (web-base). `src/hooks/useTheme.ts` ist nur ein
  dünner Wrapper, der `cycle()` und den `theme-color`-Meta-Sync ergänzt. Der
  alte App-Key `tennisturnier:theme` wird in `public/theme-init.js` einmalig
  nach `theme` migriert — nicht entfernen, solange Nutzer mit altem State existieren.
- **i18n**: alle UI-Strings über `useTranslation()` / `TranslationKey`. Deshalb
  hat die App einen eigenen `ThemeToggle` statt des deutschen aus web-base.
- **Der KV-Binding-Name `TOURNAMENTS`** ist in `functions/_shared/kv.ts`
  fest verdrahtet. In `wrangler.toml` nicht umbenennen.

## Bewusste Abweichungen

- **KV-only-Sync statt des `sync`-Templates.** Turnierdaten werden bewusst per
  Share-Code geteilt und sind nicht im selben Sinn schützenswert wie die
  E2E-verschlüsselten Daten anderer Apps. Dokumentiert in `docs/specs/sync.md`.
- **Eigener `ThemeToggle`** wegen i18n (siehe oben); der Hook ist der geteilte.
