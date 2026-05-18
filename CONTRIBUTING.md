# Mitmachen beim Tennisturnier-Planer

Danke, dass du beitragen möchtest! Egal ob Bug-Fix, neues Feature, Doku oder Übersetzung – Beiträge sind willkommen. Dieser Leitfaden hält die Hürde niedrig.

## Voraussetzungen

- [Bun](https://bun.sh/) ≥ 1.1 (Paketmanager + Test-Runner)
- Node.js ≥ 20 (für einige Tooling-Skripte)
- Git
- Optional: [Wrangler](https://developers.cloudflare.com/workers/wrangler/) für lokales Testen des Sync-Backends (`bunx wrangler dev`)

## Setup

```bash
git clone https://github.com/daniel-rck/tennisturnier.git
cd tennisturnier
bun install
bun run dev
```

Die App läuft dann unter `http://localhost:5173/`. Für das Sync-Backend zusätzlich `bunx wrangler dev` (Port `8787`).

## Branch-Konventionen

Arbeite immer auf einem Feature-Branch, nicht auf `main`:

- `feature/<kurzbeschreibung>` – neue Funktionen
- `fix/<kurzbeschreibung>` – Bug-Fixes
- `docs/<kurzbeschreibung>` – Doku-Änderungen
- `refactor/<kurzbeschreibung>` – Aufräumarbeiten ohne Verhaltensänderung

## Commit-Style

- Kurz und im Präsens (z. B. `fix: leere Runde bei ungerader Spielerzahl`)
- Deutsch oder Englisch – Hauptsache verständlich
- Ein Commit = ein Thema; lieber mehrere kleine als ein riesiger Commit

## Code-Style

- **ESLint** ist Pflicht – `bun run lint` muss grün sein
- **TypeScript** wird strict kompiliert – keine `any`-Workarounds ohne Begründung
- **Komponenten** in `src/components/`, **Logik** in `src/*.ts`, **Hooks** in `src/hooks/`
- Tailwind-Klassen direkt in JSX, kein separates CSS pro Komponente
- Bestehende Patterns nachahmen, bevor neue eingeführt werden

## Tests

Tests laufen mit [Vitest](https://vitest.dev/):

```bash
bun run test         # einmal durchlaufen
bun run test:watch   # im Watch-Modus
```

Neue Logik (Scheduler, Ranking, Statistik) bitte mit Tests in `src/__tests__/` absichern. UI-Tests sind aktuell nicht etabliert – manuelles Testen im Browser reicht für Komponenten-Änderungen.

## Pull-Request-Checkliste

Vor dem Öffnen eines PRs lokal grün:

- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run build`
- [ ] Manuelles Testen der geänderten Flows im Browser
- [ ] [CHANGELOG.md](CHANGELOG.md) unter `[Unreleased]` ergänzt (bei nutzersichtbaren Änderungen)
- [ ] PR-Beschreibung erklärt das _Warum_, nicht nur das _Was_

## Issues

Vor einem größeren Feature-PR bitte erst ein Issue öffnen, damit wir die Richtung abstimmen können. Für Bugs und Vorschläge gibt es Vorlagen unter `.github/ISSUE_TEMPLATE/`.

## Umgang miteinander

Wir arbeiten respektvoll und konstruktiv miteinander – sachliche Kritik ja, persönliche Angriffe nein. Feedback so geben, wie du es selbst gerne bekommen möchtest. Bei Konflikten gerne direkt den Maintainer ansprechen.

Viel Spaß beim Hacken! 🎾
