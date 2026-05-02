import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function PrivacyDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      window.requestAnimationFrame(() => closeBtnRef.current?.focus())
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="privacy-title"
      className="no-print rounded-lg border border-border bg-surface text-fg p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm w-[min(36rem,calc(100%-2rem))] open:animate-scale-fade-in"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
        <h2 id="privacy-title" className="text-base font-semibold text-fg">
          Datenschutzerklärung
        </h2>
        <div className="text-sm text-fg-muted mt-3 space-y-3 leading-relaxed">
          <p>
            Der Tennisturnier-Planer ist eine reine Web-/PWA-Anwendung. Wir
            verarbeiten so wenige Daten wie möglich und speichern standardmäßig
            ausschließlich auf deinem Gerät.
          </p>

          <h3 className="font-semibold text-fg mt-4">
            1. Lokale Speicherung im Browser
          </h3>
          <p>
            Turnierdaten (Spieler:innen, Spielplan, Ergebnisse, Einstellungen)
            sowie deine Theme-Wahl werden im{' '}
            <code className="text-xs">localStorage</code> deines Browsers
            abgelegt. Diese Daten verlassen dein Gerät nicht, solange du die
            Live-Sync-Funktion nicht aktivierst. Du kannst sie jederzeit über
            die Browsereinstellungen löschen.
          </p>

          <h3 className="font-semibold text-fg mt-4">
            2. Optionale Live-Sync (opt-in)
          </h3>
          <p>
            Wenn du Live-Sync aktivierst, wird das aktuelle Turnier auf einen
            Cloudflare-KV-Speicher hochgeladen und unter einem 6-stelligen
            Share-Code abrufbar gemacht. Andere Geräte können mit diesem Code
            das Turnier lesen oder spiegeln.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Übertragen werden nur die Turnierdaten – keine personenbezogenen
              Konto- oder Kontaktdaten.
            </li>
            <li>
              Spielernamen, die du eingibst, sind Teil der Turnierdaten und
              werden mit übertragen.
            </li>
            <li>
              Die Daten werden 7 Tage nach der letzten Änderung automatisch
              gelöscht (KV-TTL). Beim Verlassen einer Sync-Session als Owner
              wird der Eintrag sofort verworfen.
            </li>
            <li>
              Es gibt keine Anmeldung, kein Tracking, keine Cookies, kein
              Analytics.
            </li>
          </ul>

          <h3 className="font-semibold text-fg mt-4">3. Hosting</h3>
          <p>
            Die App wird über Cloudflare Workers ausgeliefert. Beim Aufruf der
            Seite verarbeitet Cloudflare technisch notwendige Verbindungsdaten
            (z.&nbsp;B. IP-Adresse, User-Agent, Zeitstempel) zur Bereitstellung
            und Absicherung des Dienstes. Diese Daten werden von uns nicht
            ausgewertet oder dauerhaft gespeichert.
          </p>

          <h3 className="font-semibold text-fg mt-4">
            4. Externe Ressourcen
          </h3>
          <p>
            Die App lädt keine externen Schriften, Skripte oder Tracker. Es
            werden ausschließlich die Systemschriften deines Geräts und die
            mit der App ausgelieferten Assets verwendet.
          </p>

          <h3 className="font-semibold text-fg mt-4">5. PWA / Service Worker</h3>
          <p>
            Zur Offline-Fähigkeit nutzt die App einen Service Worker, der
            Programmcode und Assets im Browser-Cache ablegt. Es werden dabei
            keine personenbezogenen Daten erfasst.
          </p>

          <h3 className="font-semibold text-fg mt-4">6. Deine Rechte</h3>
          <p>
            Da wir keine personenbezogenen Daten serverseitig speichern (außer
            den von dir freiwillig per Sync hochgeladenen Turnierdaten, die
            nach 7 Tagen automatisch verfallen), ist eine darüber
            hinausgehende Auskunft, Berichtigung oder Löschung in der Regel
            nicht erforderlich. Lokale Daten kannst du selbst über die
            Browsereinstellungen entfernen; aktive Sync-Sessions kannst du in
            der App beenden.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-hover"
          >
            Schließen
          </button>
        </div>
      </div>
    </dialog>
  )
}
