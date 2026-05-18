# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt
- Badges, prägnanter README, CONTRIBUTING-Leitfaden, Issue- und PR-Templates

### Geändert
- Build-Stack: Upgrade auf Vite 8, `@vitejs/plugin-react` 6, `vite-plugin-pwa` 1.3 und Vitest 4

## [0.1.0] - 2026-05-18

### Hinzugefügt
- Spielplan-Generator mit Round-Robin-Logik, minimiert Partner- und Gegner-Wiederholungen
- Formate: Wechselturnier (Mixed, Damen, Herren, Frei), Gruppen, KO, Gruppen + KO
- Drag-and-Drop-Sortierung der Spielerliste mit Auto-Sortierung (A→Z, Damen/Herren zuerst)
- Rundentimer mit synthetisierter Glocke (Web Audio API, ohne Asset-Download)
- Ergebnis-Eingabe direkt am Match-Karten-Element
- Siegerehrung mit Podium, optional getrennt nach Damen/Herren beim Mixed-Turnier
- Reveal-Modus mit Konfetti und Fanfare für die Show im Vereinsheim
- Live-Sync zwischen Geräten per 6-stelligem Code und QR-Code (Cloudflare KV, ~3 s Latenz, opt-in)
- Druckansicht für Aushang am Schwarzen Brett
- PWA-Unterstützung: installierbar auf Handy und Desktop, offlinefähig
- Internationalisierung vorbereitet (`src/i18n/`)
- Cloudflare Workers Deployment mit automatischen Builds bei Push auf `main`
- GitHub Actions CI: Lint, Tests, Build

[Unreleased]: https://github.com/daniel-rck/tennisturnier/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/daniel-rck/tennisturnier/releases/tag/v0.1.0
