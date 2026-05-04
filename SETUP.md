# Cloudflare Setup

Du brauchst genau **zwei Cloudflare-Services** — beide im kostenlosen Free-Tier
nutzbar, keine Kreditkarte nötig.

| Service | Resource-Name (Dashboard) | Binding (im Code) | Wofür | Free Tier |
|---|---|---|---|---|
| **Workers** | `tennisturnier` | — | Hostet die SPA + das `/api/sync/*`-Backend | 100k Requests/Tag |
| **KV** | `tennisturnier-tournaments` | `TOURNAMENTS` | Geteilte Turnier-Snapshots für Live-Sync (TTL 7 Tage) | 100k Reads/Tag, 1k Writes/Tag, 1 GB |

Der Resource-Name `tennisturnier-tournaments` ist frei wählbar — er taucht im
Code nicht auf. Der **Binding-Name** `TOURNAMENTS` ist dagegen **fest** — er
steht in `functions/_shared/kv.ts` (`env.TOURNAMENTS`) und muss bei der
Binding-Konfiguration exakt so geschrieben werden.

Der Worker-Name `tennisturnier` ist `wrangler.toml`-Default und kann frei
geändert werden — Cloudflare nutzt ihn als Subdomain
(`https://tennisturnier.<account>.workers.dev`).

Bei typischer Nutzung (1–5 parallele Turniere, je 2–4 Anzeige-Geräte) bleibst
du locker im Free-Tier — siehe Verbrauchstabelle ganz unten.

---

## Schritt-für-Schritt

### 0. Voraussetzungen

- Cloudflare-Account: <https://dash.cloudflare.com/sign-up>
- Wrangler CLI: `bun add -g wrangler` oder `npm i -g wrangler`
- Eingeloggt: `wrangler login`

### 1. KV-Namespace anlegen

```bash
wrangler kv namespace create tennisturnier-tournaments
```

Im Output steht die ID:

```
🌀 Creating namespace with title "tennisturnier-tournaments"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "TOURNAMENTS"
id = "abc123def456..."
```

ID notieren — sie kommt in Schritt 4 in die `wrangler.toml`.

> **Alternative GUI:** **Workers & Pages → Storage & Database → KV →
> Create namespace** → Name `tennisturnier-tournaments`. Die ID steht danach
> in der Liste.

### 2. Worker mit Git verbinden

Im Cloudflare-Dashboard:

1. **Workers & Pages → Create → Workers → Connect to Git**
2. Repo `daniel-rck/Tennisturnier` auswählen
3. Build settings:
   - Build command: `bun install --frozen-lockfile && bun run build`
   - Deploy command: *(leer lassen — `wrangler deploy` ist Default)*
   - Root directory: *(leer)*
4. Branch: `main`
5. **Save & Deploy**

Cloudflare erkennt Bun automatisch über `packageManager` in `package.json`.
Erster Build dauert ~1–2 Minuten. Danach ist die App unter
`https://tennisturnier.<account>.workers.dev` erreichbar — vorerst noch ohne
Live-Sync, das aktiviert sich erst nach Schritt 3 oder 4.

### 3. Bindings zuweisen ⚠️ **Der häufigste Fehler-Punkt**

**Empfohlener Weg:** in `wrangler.toml` deklarieren (Schritt 4) — dann sind die
Bindings Teil des Repos und überleben jeden Re-Deploy automatisch.

**Alternative über Dashboard** (falls du die IDs nicht ins Repo schreiben
willst): **Workers & Pages → tennisturnier → Settings → Bindings → Add binding**

| Feld | Wert |
|---|---|
| Type | KV namespace |
| Variable name | `TOURNAMENTS` *(exakt so, Großbuchstaben!)* |
| KV namespace | `tennisturnier-tournaments` |

Speichern → Cloudflare deployt automatisch neu (~30 s).

### 4. Bindings in `wrangler.toml` festhalten (empfohlen)

Den auskommentierten Block ans Ende der `wrangler.toml` aktivieren und die
ID aus Schritt 1 einsetzen:

```toml
[[kv_namespaces]]
binding = "TOURNAMENTS"
id = "<id-aus-schritt-1>"
```

Committen & pushen. Workers Builds deployt automatisch — das Binding ist
jetzt versioniert und kann nicht aus Versehen im Dashboard verschwinden.

> **Warum doppelt absichern?** Workers Builds (Git-Auto-Deploy) hat in der
> Vergangenheit gelegentlich Dashboard-Bindings überschrieben. Mit der
> wrangler.toml-Deklaration ist das sicher gelöst. Wenn du diesen Weg gehst,
> kannst du das Dashboard-Binding aus Schritt 3 auch wieder entfernen.

### 5. Verifizieren

Auf der deployten URL: **Einstellungen → Live-Sync (Multi-Device) →
"Sync für dieses Turnier starten"**.

Im Browser-Netzwerktab solltest du sehen:

1. `POST /api/sync` → **201** (Session erstellt, Response enthält `code` + `ownerToken`)
2. Status-Badge wird grün („live"), 6-stelliger Code + QR-Code erscheinen
3. Bei jeder Eingabe: `PUT /api/sync/<code>` → **200** (Snapshot gepusht)

Wenn das klappt: ✅ fertig. Code an ein zweites Gerät weitergeben oder QR
scannen lassen — dort sollte der Spielplan live mitlaufen.

---

## Troubleshooting

### `503 sync_not_configured`

Die KV-Bindung ist nicht zugewiesen — oder der Variable-Name ist falsch
geschrieben. Schritt 3 / 4 prüfen: der Name muss **exakt** `TOURNAMENTS`
lauten (alles groß, keine Unterstriche, kein Prefix).

Falls du Bindings im Dashboard gesetzt hattest: nach jeder Änderung muss
neu deployed werden. **Deployments → Retry deployment** auf den letzten
Build oder leerer Commit:

```bash
git commit --allow-empty -m "redeploy" && git push
```

### `500 sync_internal_error: <message>`

Echter Runtime-Fehler. Die Message gibt den Hinweis:

- `KV namespace … not found` → Namespace gelöscht oder ID falsch
- alles andere → Worker-Logs öffnen (*Workers → tennisturnier → Logs → Live*)
  und Fehler dort lesen, ggf. Issue auf GitHub aufmachen mit der Message

### „Code nicht gefunden"

- Tippfehler im Code (Code-Alphabet vermeidet absichtlich `0/O/1/I/L`,
  manuelles Diktieren bleibt aber fehleranfällig).
- TTL abgelaufen (7 Tage seit letztem Push). Owner muss neu starten.
- Owner hat „Sync beenden" geklickt → Code ist explizit invalidiert.

### Viewer sieht Updates erst nach 30–60 Sekunden

KV ist eventually consistent: Schreibvorgänge propagieren zwischen
Cloudflare-Edges in bis zu 60 s. In der Praxis meist <10 s. Das Polling
(alle 3 s) holt den neuen Stand, sobald er am Edge des Viewers ankommt —
für echtes Realtime bräuchte es Durable Objects, was bewusst nicht gemacht
ist (KV reicht für die typische Nutzung).

### Bindings verschwinden nach Deploy

Bekanntes Cloudflare-Verhalten: Workers Builds überschreibt manchmal
Dashboard-Bindings. → **Schritt 4** umsetzen, dann sind die Bindings im Repo
verankert.

### Lokal ohne Cloudflare entwickeln

```bash
bunx wrangler dev    # http://localhost:8787 — Worker + Assets + Mock-KV
```

Wrangler stellt einen lokalen KV-Mock bereit, also läuft Sync auch ohne
Cloud-KV-Namespace gegen einen In-Memory-Store.

---

## Verbrauch / Free-Tier-Limits

| Ressource | Free-Limit | Verbrauch dieser App |
|---|---|---|
| Workers Requests | 100k / Tag | ~50/Sync-Sitzung (Owner-Push, debounced) + ~1.2k pro Viewer & Stunde (3 s-Polling) → 1 paralleles Turnier mit 3 Viewern ≈ 4k/Tag |
| KV Reads | 100k / Tag | Identisch zum Polling: ~1.2k pro Viewer & Stunde |
| KV Writes | 1k / Tag | Nur Owner-Pushes, debounced auf 1 s, also ~10–30 / Sitzung |
| KV Storage | 1 GB | Ein Turnier-Snapshot ≈ 5–20 KB, TTL 7 Tage → faktisch nie ausgereizt |

Selbst mit 5 parallelen Turnieren + je 3 Viewer-Geräten bleibst du locker
unter dem Free-Limit. Falls doch mal nötig: Workers Paid Plan kostet $5/Monat
für 10 Mio Requests.

---

## Was du **nicht** brauchst

- ❌ Pages (das Projekt nutzt seit PR #3 die neueren Workers Builds, keine Pages Functions)
- ❌ R2, Durable Objects, D1, Queues
- ❌ Workers AI, Vectorize, Browser Rendering
- ❌ Argo, Load Balancing, Spectrum
- ❌ Eine bezahlte Workers- oder KV-Stufe
