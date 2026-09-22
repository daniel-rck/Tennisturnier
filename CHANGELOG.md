# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt
- Badges, prägnanter README, CONTRIBUTING-Leitfaden, Issue- und PR-Templates

### Geändert
- Tooling: web-base 0.5.0 — Lint/Format mit oxlint + oxfmt statt Biome
- Abhängigkeiten aktualisiert (u. a. React 19.3, Vite 8.3, Vitest 5)
- Build-Stack: Upgrade auf Vite 8, `@vitejs/plugin-react` 6, `vite-plugin-pwa` 1.3 und Vitest 4
- Vollständige Internationalisierung: Spielplan-/Gruppen-Warnungen, KO-Bracket-Platzhalter
  und Sync-Fehlermeldungen werden nun übersetzt (vorher teils hartcodiert deutsch)
- Kleineres Initial-Bundle (~21 % weniger gzip): `canvas-confetti`, `qrcode` und die
  Drag-and-Drop-Panels (`@dnd-kit`) werden erst bei Bedarf nachgeladen

### Behoben
- Gruppen-, KO- und Gruppen+KO-Turniere lassen sich wieder starten: Gruppenplan und
  Bracket werden direkt aus den Teams gebaut, statt erst beim Öffnen des jeweiligen Tabs
  (vorher sprang „Turnier läuft“ zurück in die Vorbereitung)
- KO: Wird ein früheres Ergebnis korrigiert, verschwinden Ergebnisse späterer Runden, deren
  Paarung sich dadurch ändert (vorher blieben sie bei den falschen Teams stehen)
- KO mit Freilosen gilt nach dem Finale als abgeschlossen
- Rundentimer: Pause behält die Restzeit, abgelaufene Zeit wird angezeigt
- Statistik zählt alle KO-Runden, nicht nur die erste
- Namen können wieder mit Leerzeichen getippt werden (Trimmen erst beim Verlassen des Felds)
- Export enthält keine Sync-Daten mehr; ein Re-Import macht den Owner nicht zum Viewer
- Beitreten per Link fragt nach, bevor ein lokales Turnier ersetzt wird (und ist rückgängig machbar)
- „Neues Turnier“ beendet eine laufende Live-Sitzung sauber
- Geschlechtswechsel verwirft einen Mixed-Spielplan, dessen Paarungen ungültig würden
- Live-Sync: Netzwerkfehler beim Starten/Beitreten hängen nicht mehr dauerhaft im
  Status „verbinde…“; Viewer-Polling schützt jetzt vor überlappenden Anfragen
- Owner-Token wird in der Oberfläche maskiert dargestellt (Kopieren weiterhin möglich)
- `parsePositiveInt` weist negative Eingaben korrekt ab (Fallback statt negativem Wert)

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
