# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt
- Badges, prägnanter README, CONTRIBUTING-Leitfaden, Issue- und PR-Templates
- „Zum Inhalt springen“-Link für Tastatur-Nutzer:innen (erstes fokussierbares Element)
- Offline-Hinweis als Badge im Header (ersetzt das bisherige Offline-Banner)
- Fehlerseite statt leerer Seite bei Fehlern in der Navigation; nach einem Deploy
  mit fehlenden Programmteilen gibt es „Neu laden“
- „Seite nicht gefunden“ für unbekannte Adressen (vorher stille Weiterleitung auf die Startseite)
- Seitentitel im Browser-Tab nennt die aktuelle Phase (z. B. „Turnier läuft · Tennisturnier-Planer“)
- Update-Hinweis prüft stündlich auf neue Versionen, auch wenn die App lange offen bleibt

### Geändert
- Tooling: web-base 0.5.0 — Lint/Format mit oxlint + oxfmt statt Biome
- web-base 0.6.0: neue Akzentfarbe Smaragd (Hue 175 statt 155) mit klarem Abstand zum
  Erfolgs-Grün; Theme-Farbe der installierten App ist jetzt `#007e5a`
- Kräftigere Akzent- und Gefahr-Töne: Text auf Buttons und Hinweisen erreicht überall
  WCAG AA (4,5:1), auch im Dark Mode
- Tastaturfokus als echter Fokusrahmen statt Schatten-Ring — bleibt im
  Windows-Kontrastmodus sichtbar
- Update-Hinweis sitzt auf dem Handy oberhalb der unteren Navigation
- Keine Schriftarten mehr von Google Fonts (wurden ohnehin nicht verwendet) — keine
  Verbindung zu Drittanbietern beim Laden
- Strengere Sicherheits-Header (Content-Security-Policy, HSTS, Frame-Schutz)
- Abhängigkeiten aktualisiert (u. a. React 19.3, Vite 8.3, Vitest 5)
- Build-Stack: Upgrade auf Vite 8, `@vitejs/plugin-react` 6, `vite-plugin-pwa` 1.3 und Vitest 4
- Vollständige Internationalisierung: Spielplan-/Gruppen-Warnungen, KO-Bracket-Platzhalter
  und Sync-Fehlermeldungen werden nun übersetzt (vorher teils hartcodiert deutsch)
- Kleineres Initial-Bundle (~21 % weniger gzip): `canvas-confetti`, `qrcode` und die
  Drag-and-Drop-Panels (`@dnd-kit`) werden erst bei Bedarf nachgeladen

### Verbessert (Bedienung)
- Ergebnis-Tastenfeld: Seite antippen zum Auswählen, zweistellige Ergebnisse (z. B. 10:8),
  kein stilles Überschreiben mehr; größere ±-Tasten
- Bottom-Sheets haben einen Schließen-Button; eindeutige Titel-IDs für Screenreader
- Rückfrage vor „Spielplan neu erstellen“ (wenn schon Ergebnisse drin sind) und vor „Show neu starten“
- Bestätigung nach dem Sammel-Import von Spieler:innen/Teams
- KO: lesbare Match-Namen statt IDs, Hinweis bei noch gesperrten Ergebnisfeldern
- Fehlende Übersetzungen und Beschriftungen (Sortierung, Geschlecht, Eingabefelder, ±-Tasten)
  ergänzt; Touch-Ziele auf mindestens 44 px vergrößert
- Timer wird nicht mehr jede 200 ms per Screenreader angesagt

### Behoben
- Gruppen-, KO- und Gruppen+KO-Turniere lassen sich wieder starten: Gruppenplan und
  Bracket werden direkt aus den Teams gebaut, statt erst beim Öffnen des jeweiligen Tabs
  (vorher sprang „Turnier läuft“ zurück in die Vorbereitung)
- KO: Wird ein früheres Ergebnis korrigiert, verschwinden Ergebnisse späterer Runden, deren
  Paarung sich dadurch ändert (vorher blieben sie bei den falschen Teams stehen)
- KO mit Freilosen gilt nach dem Finale als abgeschlossen
- KO-Ergebnisse lassen sich erst eintragen, wenn beide Gegner feststehen – auch in der
  Übersicht und bei Gruppen+KO (Gruppenplätze gelten erst, wenn die Gruppe fertig ist);
  ein Unentschieden im KO gilt nicht als abgeschlossen
- Beitreten per Link wartet, bis das lokale Turnier geladen ist (keine Rückfrage übersprungen,
  kein Überschreiben des beigetretenen Turniers mehr)
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
- Dark Mode nach Systemeinstellung: die aktive Phase in der Navigation wird auch ohne
  manuell gewähltes Theme dunkel hervorgehoben
- Warnhinweise sind im Dark Mode wieder lesbar (dunkler Text auf dunklem Grund)
- Die Browser-Leistenfarbe folgt jetzt dem manuell gewählten Theme
- Ein in einem anderen Tab gewechseltes Theme wird übernommen

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
