<p align="center">
  <img src="public/logo.svg" alt="Tennisturnier-Planer" width="160" />
</p>

<h1 align="center">Tennisturnier-Planer</h1>

<p align="center">
  Kostenlose, browserbasierte Web-App zum Planen kleiner Tennisturniere – Spielplan, Rundentimer mit Glocke, Ergebnis-Eingabe und Siegerehrung.
  <br/>
  <em>Live-URL wird vom Cloudflare-Pages-Projekt nach dem ersten Deploy gesetzt.</em>
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
| Hosting | Cloudflare Workers (Workers Builds, Git-Integration) mit Static Assets + KV |
| Speicher | `localStorage` |
| Sound | Web Audio API (synthetisierte Glocke) |

## Lokal entwickeln

```bash
npm install
npm run dev      # http://localhost:5173/   (Vite Dev Server, ohne Sync-Backend)
npm run build    # baut nach dist/
npm run lint
npm run test
```

Wenn du das Sync-Backend lokal mittesten willst (Worker + Static Assets + KV-Mock):

```bash
npx wrangler dev
# bedient SPA + API auf http://localhost:8787
# führt vorher automatisch `npm run build` aus (siehe wrangler.toml [build])
```

## Deployment (Cloudflare Workers mit Git-Integration)

Workers Builds baut und deployt bei jedem Push automatisch — kein eigener Workflow nötig. Einmaliges Setup:

1. **Worker-Projekt anlegen**: [Cloudflare Dashboard](https://dash.cloudflare.com/) → *Workers & Pages* → *Create* → *Import a repository* → dieses Repo auswählen. Cloudflare erkennt `wrangler.toml` automatisch.
2. **Erste Deploys laufen ohne Sync** durch — die App wird statisch ausgeliefert, der Sync-Button bleibt deaktiviert (es fehlt das KV-Binding).
3. **KV-Namespace anlegen und binden** (aktiviert Live-Sync):

   **Variante A — im Dashboard** (einfacher):
   - *Worker → Storage & Databases → KV → Create a namespace* → Name z. B. `tennisturnier-tournaments`.
   - *Worker → Settings → Bindings → Add → KV namespace* → Variable `TOURNAMENTS` → den eben angelegten Namespace wählen → speichern. Beim nächsten Deploy ist das Binding aktiv.

   **Variante B — über `wrangler.toml`** (deklarativ, im Repo nachvollziehbar):
   ```bash
   npx wrangler kv namespace create TOURNAMENTS
   npx wrangler kv namespace create TOURNAMENTS --preview
   ```
   Den auskommentierten `[[kv_namespaces]]`-Block am Ende von `wrangler.toml` aktivieren und die zurückgegebenen IDs einsetzen, dann committen.

4. **Custom Domain** (optional): *Worker → Settings → Domains & Routes → Add* — Cloudflare verwaltet DNS automatisch, falls die Domain bereits dort liegt.

Jeder Push auf `main` wird zur Production deployt; jeder Branch / PR bekommt automatisch eine Preview-Deployment-URL.

PR-CI (Lint + Tests + Build) läuft als GitHub Action `.github/workflows/ci.yml` — unabhängig von Cloudflare als zusätzliche Sicherung.

> **Hinweis bei Migration von GitHub Pages:** Wer die App vorher unter `daniel-rck.github.io/Tennisturnier/` installiert hatte, muss den alten Service Worker einmal manuell entfernen (DevTools → Application → Service Workers → Unregister) bzw. die App neu installieren — der PWA-Scope hat sich von `/Tennisturnier/` auf `/` geändert.

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
