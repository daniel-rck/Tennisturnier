<p align="center">
  <img src="public/logo.svg" alt="Tennisturnier-Planer" width="160" />
</p>

<h1 align="center">Tennisturnier-Planer</h1>

<p align="center">
  Browserbasierte Web-App für kleine Tennisturniere – Spielplan, Rundentimer, Ergebnis-Eingabe, Siegerehrung. Keine Anmeldung, offlinefähig.
</p>

---

## Was das ist

Du gibst Plätze, Spieler:innen und Modus an und bekommst einen Spielplan, in dem in jeder Runde alle Plätze besetzt sind und möglichst niemand zweimal mit derselben Person gespielt hat. Während der Runde läuft optional ein Timer, der mit einer Glocke das Ende ankündigt. Nach den Spielen trägst du Ergebnisse ein, und die App rechnet eine Siegerehrung mit Podium.

Alles läuft im Browser. Daten bleiben standardmäßig auf deinem Gerät (`localStorage`). Optional kann ein Turnier per Share-Code zwischen Geräten live synchronisiert werden — z. B. Eingabe am Handy, Anzeige auf dem Vereinsheim-TV.

## Features

- **Formate:** Wechselturnier (Mixed, Damen, Herren, Frei), Gruppen, KO, Gruppen + KO
- **Spielplan-Generator:** füllt jede Runde alle Plätze, minimiert Partner- und Gegner-Wiederholungen, verteilt Pausen fair, optional Teilrunde damit alle gleich oft spielen
- **Drag-and-Drop-Sortierung** der Spielerliste, Auto-Sortierung (A→Z, Damen/Herren zuerst)
- **Rundentimer** mit synthetisierter Glocke (Web Audio, kein Asset-Download)
- **Ergebnis-Eingabe** direkt am Match
- **Siegerehrung** mit Podium 🥇🥈🥉, optional getrennt nach Damen/Herren beim Mixed-Turnier; Reveal-Modus mit Konfetti & Fanfare für die Show im Vereinsheim
- **Live-Sync** zwischen Geräten per 6-stelligem Code (opt-in, ~3 s Latenz, QR-Code zum Beitreten)
- **Druckansicht** für Aushang am Schwarzen Brett
- **PWA / Offline:** installierbar auf Handy und Desktop

---

## Tech-Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7, Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` mit Workbox |
| Hosting | Cloudflare Workers (Workers Builds, Git-Integration) mit Static Assets + KV |
| Speicher | `localStorage` (lokal), Cloudflare KV (optional, für Live-Sync) |

## Lokal entwickeln

```bash
bun install
bun run dev      # http://localhost:5173/  (Vite, ohne Sync-Backend)
bun run build
bun run lint
bun test
```

Sync-Backend lokal mittesten (Worker + Static Assets + KV-Mock):

```bash
bunx wrangler dev   # http://localhost:8787  (SPA + API)
```

## Deployment

Cloudflare Workers Builds baut und deployt bei jedem Push automatisch via Git-Integration:

1. *Workers & Pages → Create → Import a repository* → Repo wählen. Cloudflare erkennt `wrangler.toml` automatisch.
2. *Worker → Storage → KV → Create namespace*, dann *Settings → Bindings → Add → KV*, Variable `TOURNAMENTS` auf den Namespace setzen. (Ohne dieses Binding läuft die App statisch ohne Live-Sync.)
3. Optional: *Settings → Domains & Routes* für eine Custom Domain.

Jeder Push auf `main` deployt zur Production; Branches/PRs bekommen Preview-URLs. PR-CI (Lint + Tests + Build) läuft separat als GitHub Action.

Schritt-für-Schritt-Anleitung inkl. Free-Tier-Limits und Troubleshooting: [`SETUP.md`](SETUP.md).

## Algorithmus (kurz)

Der Spielplan-Generator (`src/scheduler.ts`) arbeitet greedy pro Runde: Spieler:innen-Auswahl nach Pausen-Saldo → Paarbildung per bipartitem Matching (Mixed) bzw. Perfect Matching → Court-Verteilung minimiert wiederholte Gegner-Begegnungen. Im Test mit 4F + 4M, 2 Plätzen, 4 Runden Mixed: 0 Partner-Wiederholungen, jede Frau spielt mit jedem Mann genau einmal.

## Lizenz

Privates Projekt für den Vereinsalltag – gerne forken und anpassen.
