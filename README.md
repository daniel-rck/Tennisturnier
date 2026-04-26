<p align="center">
  <img src="public/logo.svg" alt="Tennisturnier-Planer" width="160" />
</p>

<h1 align="center">Tennisturnier-Planer</h1>

<p align="center">
  Kostenlose, browserbasierte Web-App zum Planen kleiner Tennisturniere – Spielplan, Rundentimer mit Glocke, Ergebnis-Eingabe und Siegerehrung.
  <br/>
  <a href="https://daniel-rck.github.io/Tennisturnier/"><strong>Live öffnen →</strong></a>
</p>

---

## Was das ist

Eine schlanke Progressive Web App für den Vereins-Alltag: Du gibst Plätze, Spieler:innen und Modus an und bekommst einen Spielplan, in dem in jeder Runde alle Plätze besetzt sind und möglichst niemand zweimal mit derselben Person gespielt hat. Während der Runde läuft optional ein Timer, der mit einer Glocke das Ende ankündigt. Nach den Spielen trägst du die gewonnenen Spiele ein, und die App rechnet daraus eine Siegerehrung mit Podium.

Alles läuft serverless im Browser – keine Anmeldung, keine Daten verlassen dein Gerät, offlinefähig nach dem ersten Aufruf.

## Features

- **Spielmodi:** Gemischtes Doppel, Damen-Doppel, Herren-Doppel, Freies Doppel
- **Spielplan-Generator:** füllt jede Runde alle Plätze, minimiert Partner- und Gegner-Wiederholungen, verteilt Pausen fair
- **Drag-and-Drop-Sortierung** der Spielerliste plus Auto-Sortierung (A→Z, Damen zuerst, Herren zuerst)
- **Rundentimer mit Glocke:** Spielzeit pro Runde einstellen, Start / Pause / Reset, akustisches Signal am Ende (Web Audio, kein Asset-Download)
- **Ergebnis-Eingabe** direkt am Match (Spiele Team A : Team B)
- **Siegerehrung** mit Podium 🥇🥈🥉 und Tabelle (Siege → Spielesaldo → gewonnene Spiele → Name)
- **Druckansicht** für Aushang am Schwarzen Brett – inklusive leerer Ergebnis-Zeilen, falls noch keine eingetragen sind
- **PWA / Offline:** installierbar auf Handy und Desktop, Service-Worker cached alles
- **Persistenz** in `localStorage` – Reload, Browser-Schließen, alles bleibt erhalten

## Tech-Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8, Tailwind CSS 4 |
| PWA | `vite-plugin-pwa` mit Workbox |
| Drag-and-Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Hosting | GitHub Pages, Deploy via GitHub Actions |
| Speicher | `localStorage` |
| Sound | Web Audio API (synthetisierte Glocke) |

## Lokal entwickeln

```bash
npm install
npm run dev      # http://localhost:5173/Tennisturnier/
npm run build    # baut nach dist/
npm run lint
```

## Deployment

Push auf `main` → die Action `.github/workflows/deploy.yml` baut und deployt automatisch nach GitHub Pages. In den Repo-Einstellungen muss **Pages → Source = „GitHub Actions“** gesetzt sein.

## Logo austauschen

Das Logo liegt unter [`public/logo.svg`](public/logo.svg) als generischer Tennis-Ball-Platzhalter. Um dein eigenes Gemini-generiertes Logo zu verwenden:

1. Lade das Bild herunter und schneide den weißen Rand ab (z. B. mit [remove.bg](https://www.remove.bg/), Photoshop, GIMP oder einem Browser-Tool).
2. Speichere es als `public/logo.png` (oder ersetze `public/logo.svg`).
3. Falls du den Dateinamen änderst, passe den Pfad oben in der README sowie in `public/favicon.svg` und `vite.config.ts` (Manifest-Icons) an.

> **Hinweis:** Während der Erstellung dieser App war der Sandbox-Proxy auf `lh3.googleusercontent.com` blockiert, daher konnte das ursprünglich verlinkte Gemini-Logo nicht direkt eingebaut werden. Der SVG-Platzhalter passt aber farblich zur App.

## Algorithmus (kurz)

Der Spielplan-Generator (`src/scheduler.ts`) arbeitet greedy pro Runde:

1. Wähle die Spieler:innen, die spielen, nach `(meist gepaust ↓, am wenigsten gespielt ↓, manuelle Reihenfolge ↑)`.
2. Bilde Paare per **bipartitem Matching** (Damen × Herren bei Mixed) bzw. **Perfect Matching** (gleichgeschlechtlich / frei). Brute-Force bis 8 pro Geschlecht (~40k Permutationen), darüber Greedy.
3. Verteile die Paare auf Plätze, sodass die Summe der bisher schon gespielten Gegner-Begegnungen minimal wird.
4. Update der Counter und ab in die nächste Runde.

Im Test mit 4 Damen + 4 Herren, 2 Plätzen, 4 Runden Mixed: **0 Partner-Wiederholungen** über alle Runden, jede Frau spielt mit jedem Mann genau einmal.

## Lizenz

Privates Projekt für den Vereinsalltag – gerne forken und anpassen.
