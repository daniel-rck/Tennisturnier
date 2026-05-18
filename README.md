<p align="center">
  <img src="public/logo.svg" alt="Tennisturnier-Planer" width="160" />
</p>

<h1 align="center">Tennisturnier-Planer</h1>

<p align="center">
  Browserbasierte Web-App für kleine Tennisturniere – Spielplan, Rundentimer, Ergebnis-Eingabe, Siegerehrung.<br/>
  Keine Anmeldung, offlinefähig, mit optionalem Live-Sync zwischen Geräten.
</p>

<p align="center">
  <a href="https://github.com/daniel-rck/tennisturnier/actions/workflows/ci.yml"><img src="https://github.com/daniel-rck/tennisturnier/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT" /></a>
  <a href="https://tennisturnier.daniel-rck.workers.dev/"><img src="https://img.shields.io/badge/demo-live-blueviolet?logo=cloudflare&logoColor=white" alt="Live Demo" /></a>
  <br/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
</p>

---

## 🎾 Live ausprobieren

**→ [tennisturnier.daniel-rck.workers.dev](https://tennisturnier.daniel-rck.workers.dev/)**

Direkt im Browser starten – nichts installieren, keine Anmeldung. Daten bleiben auf deinem Gerät, optional via 6-stelligem Code zwischen Geräten teilen.

## Features

- 🎯 **Formate:** Wechselturnier (Mixed, Damen, Herren, Frei), Gruppen, KO, Gruppen + KO
- 🧮 **Spielplan-Generator:** alle Plätze besetzt, Partner- & Gegner-Wiederholungen minimiert, faire Pausen
- ✋ **Drag-and-Drop** Spielerliste mit Auto-Sortierung
- ⏱️ **Rundentimer** mit synthetisierter Glocke (Web Audio, kein Asset-Download)
- 📝 **Ergebnis-Eingabe** direkt am Match
- 🏆 **Siegerehrung** mit Podium, optional getrennt nach Damen/Herren – Reveal-Modus mit Konfetti & Fanfare
- 🔄 **Live-Sync** zwischen Geräten per 6-stelligem Code + QR (~3 s Latenz, opt-in)
- 🖨️ **Druckansicht** für den Aushang
- 📱 **PWA / Offline:** installierbar auf Handy & Desktop

## Quick Start (Entwickler)

```bash
bun install
bun run dev          # http://localhost:5173/
```

Mit Sync-Backend (Worker + KV-Mock) lokal:

```bash
bunx wrangler dev    # http://localhost:8787
```

## Scripts

| Befehl | Zweck |
|---|---|
| `bun run dev` | Vite Dev-Server (ohne Sync-Backend) |
| `bun run build` | Production-Build (`dist/`) |
| `bun run lint` | ESLint über alle TS/TSX-Dateien |
| `bun run test` | Vitest einmalig ausführen |
| `bun run preview` | Production-Build lokal previewen |

## Tech-Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind 4 · vite-plugin-pwa · Cloudflare Workers (Static Assets + KV) · Vitest · ESLint 9 · Bun

## Architektur

Der Spielplan-Generator (`src/scheduler.ts`) arbeitet greedy pro Runde: Spieler:innen-Auswahl nach Pausen-Saldo → Paarbildung per bipartitem Matching (Mixed) bzw. Perfect Matching → Court-Verteilung minimiert wiederholte Gegner. Persistenz lokal via `localStorage` (`src/storage.ts`); Live-Sync optional über `functions/api/sync/*` gegen Cloudflare KV.

## Deployment

Cloudflare Workers Builds deployt automatisch bei jedem Push auf `main`. Detaillierte Einrichtung (KV-Namespace, Bindings, Domain) → siehe **[SETUP.md](SETUP.md)**.

## Mitmachen

Pull Requests sind willkommen! Bitte vorher [CONTRIBUTING.md](CONTRIBUTING.md) lesen – dort stehen Setup, Branch- und Commit-Konventionen sowie die PR-Checkliste.

## Changelog

Alle Änderungen werden in [CHANGELOG.md](CHANGELOG.md) im Keep-a-Changelog-Format dokumentiert.

## Lizenz

[MIT](LICENSE) – gerne forken und anpassen.
