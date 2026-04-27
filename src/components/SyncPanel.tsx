import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Tournament } from '../types'
import type { SyncRole, SyncStatus } from '../hooks/useSync'

interface Props {
  tournament: Tournament
  status: SyncStatus
  role: SyncRole
  error: string | null
  onCreate: () => Promise<string>
  onJoin: (code: string) => Promise<void>
  onLeave: () => void
}

export function SyncPanel({
  tournament,
  status,
  role,
  error,
  onCreate,
  onJoin,
  onLeave,
}: Props) {
  const sync = tournament.sync
  const [busy, setBusy] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!sync || role !== 'owner') {
      setQrDataUrl(null)
      return
    }
    const url = `${window.location.origin}${window.location.pathname}?join=${sync.shareCode}`
    QRCode.toDataURL(url, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [sync, role])

  const handleCreate = async () => {
    setBusy(true)
    try {
      await onCreate()
    } catch {
      // status surfaces error
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    try {
      await onJoin(joinCode)
      setJoinCode('')
    } catch {
      // status surfaces error
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Live-Sync (Multi-Device)</h2>
        <StatusBadge status={status} />
      </div>

      {role === 'none' && (
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Teile dein Turnier zwischen mehreren Geräten — z.B. Eingabe auf
            dem Handy, Anzeige auf dem TV. Daten landen für 7 Tage in
            Cloudflare KV und werden danach gelöscht.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Sync für dieses Turnier starten
            </button>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs text-slate-500 mb-1">
              ...oder als Anzeige einem bestehenden Code beitreten:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="z.B. K7P3MN"
                maxLength={6}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono uppercase tracking-widest"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy || joinCode.length !== 6}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-emerald-400 disabled:opacity-50"
              >
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'owner' && sync && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Code an Anzeige-Geräte weitergeben oder QR scannen lassen.
          </p>
          <div className="flex items-center gap-4">
            <div className="font-mono text-3xl font-bold tracking-widest bg-emerald-50 border border-emerald-200 rounded px-4 py-2">
              {sync.shareCode}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(sync.shareCode)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Code kopieren
            </button>
          </div>
          {qrDataUrl && (
            <div className="flex items-start gap-3">
              <img
                src={qrDataUrl}
                alt="QR-Code zum Beitreten"
                className="rounded border border-slate-200 bg-white"
              />
              <p className="text-xs text-slate-500">
                Scan auf dem Anzeige-Gerät — öffnet die App im
                Nur-Lese-Modus.
              </p>
            </div>
          )}
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-800">
              Owner-Token (für Backup)
            </summary>
            <p className="mt-1">
              Wird auf diesem Gerät gespeichert. Geht es verloren, kann
              niemand mehr schreiben — dann neuen Code erzeugen.
            </p>
            <code className="mt-1 block break-all bg-slate-50 p-2 rounded text-[10px] text-slate-700">
              {sync.ownerToken}
            </code>
          </details>
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-rose-700 hover:text-rose-900 underline"
          >
            Sync beenden (Code wird ungültig)
          </button>
        </div>
      )}

      {role === 'viewer' && sync && (
        <div className="space-y-2 text-sm">
          <p>
            Verbunden mit Code{' '}
            <span className="font-mono font-bold">{sync.shareCode}</span> —
            nur Anzeige.
          </p>
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Verbindung trennen
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
          {error}
        </p>
      )}
    </section>
  )
}

function StatusBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { label: string; cls: string }> = {
    disabled: { label: 'aus', cls: 'bg-slate-100 text-slate-600' },
    connecting: { label: 'verbinde…', cls: 'bg-amber-100 text-amber-800' },
    live: { label: 'live', cls: 'bg-emerald-100 text-emerald-800' },
    offline: { label: 'offline', cls: 'bg-orange-100 text-orange-800' },
    error: { label: 'fehler', cls: 'bg-rose-100 text-rose-800' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      ● {label}
    </span>
  )
}
