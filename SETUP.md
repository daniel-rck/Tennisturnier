# Cloudflare-Setup für Tennisturnier

Was im Cloudflare-Dashboard angelegt werden muss, damit die App + Live-Sync läuft.
**Alles im Free Tier möglich** — keine Kreditkarte, keine laufenden Kosten zu erwarten.

---

## Übersicht

| Service | Wofür | Pflicht? |
|---|---|---|
| **Workers** (Workers Builds) | hostet die SPA + Sync-API, baut bei jedem Git-Push | ✅ ja |
| **Workers KV** Namespace | Speichert die geteilten Turnier-Snapshots (7-Tage-TTL) | ⚠️ nur für Live-Sync |
| **Custom Domain** | eigene URL statt `*.workers.dev` | optional |

Ohne KV läuft die App ganz normal (nur lokal, kein Multi-Device-Sync). Sobald
KV gebunden ist, schalten sich die „Sync starten" / „Code beitreten"-Buttons frei.

---

## 1. Workers Service einrichten (Workers Builds)

Einmalig pro Repo. Cloudflare baut dann bei jedem Push auf `main` automatisch.

1. **Cloudflare Dashboard → Workers & Pages → Create → Import a repository**
2. GitHub authentifizieren, `daniel-rck/Tennisturnier` auswählen.
3. Settings, die Cloudflare aus `wrangler.toml` zieht — meist nichts ändern,
   nur prüfen:
   - **Build command:** `bun install && bun run build`
   - **Deploy command:** leer (wrangler übernimmt)
   - **Root directory:** leer (Repo-Root)
   - **Compatibility date:** wie in `wrangler.toml` (`2024-12-30`)
4. **Save and Deploy.** Erster Build dauert ~1–2 Min. Danach ist die App unter
   `https://tennisturnier.<dein-account>.workers.dev` erreichbar.

> Falls der Build mit „command not found: bun" abbricht, ist die Workers-Build-
> Image-Version zu alt. In den Settings auf „v3" o. ä. stellen, oder als
> Build-Command `npm install -g bun && bun install && bun run build` setzen.

---

## 2. KV Namespace anlegen (für Live-Sync)

1. **Workers & Pages → KV → Create a namespace**
2. Name frei wählen, z. B. `tennisturnier-tournaments`. Der Anzeigename ist
   nur intern, die App referenziert das Binding über den Variablennamen
   (siehe Schritt 3).
3. *Optional* einen zweiten Namespace `tennisturnier-tournaments-preview` für
   Preview-Deployments anlegen — dann sehen PRs ihre eigenen Daten und stören
   die Production-Sync-Sessions nicht.

---

## 3. KV ans Worker binden

1. **Workers & Pages → tennisturnier → Settings → Variables and Secrets →
   KV namespace bindings → Add binding**
2. Eintragen:
   - **Variable name:** `TOURNAMENTS` (genau so, Groß-/Kleinschreibung zählt)
   - **KV namespace:** den aus Schritt 2 auswählen
3. Speichern → Cloudflare deployt automatisch neu (~30 s).

> ⚠️ Der Variablenname muss exakt `TOURNAMENTS` sein — die Handler in
> `functions/_shared/kv.ts` greifen direkt auf `env.TOURNAMENTS` zu. Falsch
> getippt → die App liefert 503 mit „Live-Sync ist nicht eingerichtet".

---

## 4. (Optional) Custom Domain

1. **Workers & Pages → tennisturnier → Settings → Domains & Routes → Add →
   Custom Domain**
2. Domain eintragen, Cloudflare ergänzt den DNS-Eintrag automatisch (Domain
   muss in Cloudflare gehostet sein).

---

## Verifizieren, dass alles läuft

1. App öffnen, *Einstellungen* → Block „Live-Sync (Multi-Device)".
2. Auf „Sync für dieses Turnier starten" klicken.
3. Erwartet: 6-stelliger Code + QR-Code erscheinen, Status-Badge wird grün
   („live").
4. Falls statt Code eine Fehlermeldung erscheint:
   - **„Live-Sync ist nicht eingerichtet"** → Schritt 3 prüfen (Binding-Name
     oder fehlender Re-Deploy nach Binding).
   - **„HTTP 500" / „sync\_internal\_error"** → Worker-Logs öffnen
     (*Workers → tennisturnier → Logs → Live*) und Fehler dort lesen.

---

## Kosten / Limits (Free Plan, Stand 2026)

| Ressource | Free-Limit | Verbrauch dieser App |
|---|---|---|
| Workers Requests | 100k / Tag | ~50/Sync-Sitzung (Owner-Push) + ~1.2k (Viewer-Polling alle 3 s über 1 h) → 1 paralleles Turnier ≈ 1.3k Requests |
| KV Reads | 100k / Tag | identisch zum Polling: ~1.2k pro Viewer & Stunde |
| KV Writes | 1k / Tag | nur Owner-Pushes, debounced auf 1 s, also ~10–30 / Sitzung |
| KV Storage | 1 GB | ein Turnier-Snapshot ≈ 5–20 KB → faktisch nie ausgereizt |
| KV TTL | – | App setzt 7 Tage, danach Auto-Cleanup |

Selbst mit 5 parallelen Turnieren + je 3 Viewer-Geräten bleibst du locker
unter dem Free Limit. Falls doch mal nötig: Workers Paid Plan kostet $5/Monat
für 10 Mio Requests.

---

## Was du **nicht** brauchst

- ❌ Pages (das Projekt nutzt seit PR #3 die neueren Workers Builds, keine Pages Functions)
- ❌ Durable Objects, D1, R2, Queues
- ❌ Workers AI, Vectorize, Browser Rendering
- ❌ Argo, Load Balancing, Spectrum
- ❌ Eine bezahlte Workers- oder KV-Stufe

---

## Troubleshooting

### „HTTP 503 sync\_not\_configured"
KV-Binding fehlt oder heißt nicht `TOURNAMENTS`. Schritt 3 nochmal prüfen,
besonders ob nach dem Add-Binding ein neuer Deploy gelaufen ist (sieht man
in *Deployments*).

### Code-Eingabe „nicht gefunden"
- Tippfehler im Code (auf Klein-l vs. groß-I aufpassen — der Code-Alphabet
  vermeidet das absichtlich, aber manuelles Diktieren bleibt fehleranfällig).
- TTL abgelaufen (7 Tage seit letztem Push). Dann Owner muss neu starten.
- Owner hat „Sync beenden" geklickt → Code ist explizit invalidiert.

### Viewer sieht Updates erst nach ~30–60 s
KV ist eventually consistent: Schreibvorgänge propagieren cross-Edge in bis
zu 60 s. In der Praxis meist <10 s. Für echtes Realtime bräuchte es Durable
Objects — bewusst nicht gemacht, weil Free-Tier-Workers KV reicht.

### Lokal ohne Cloudflare entwickeln
```bash
bunx wrangler dev    # http://localhost:8787 — Worker + Assets + Mock-KV
```
Wrangler stellt einen lokalen KV-Mock bereit, also läuft Sync auch ohne
Cloud-KV-Namespace.
