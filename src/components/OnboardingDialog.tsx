import { useEffect, useRef, useState } from 'react'

interface Slide {
  key: string
  icon: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: '🎾',
    title: 'Willkommen zum Tennisturnier-Planer',
    body: 'Spielplan, Rundentimer, Ergebnis-Eingabe und Siegerehrung — alles im Browser, ohne Anmeldung.',
  },
  {
    key: 'formats',
    icon: '🏆',
    title: 'Vier Turnierformate',
    body: 'Wechselturnier (Mixed/Damen/Herren/Frei), Gruppenphase, KO oder Gruppen + KO. Du wählst das Format auf der Setup-Seite aus.',
  },
  {
    key: 'privacy',
    icon: '🔒',
    title: 'Deine Daten bleiben hier',
    body: 'Lokal im Browser gespeichert — nichts verlässt dein Gerät. Optional: Live-Sync per Code zwischen Geräten, z.B. Eingabe am Handy, Anzeige auf dem TV.',
  },
  {
    key: 'start',
    icon: '🚀',
    title: 'Bereit?',
    body: 'Lege Spieler:innen oder Teams an, generiere den Spielplan und trage Ergebnisse ein. Die Siegerehrung berechnet sich automatisch.',
  },
]

interface Props {
  onDone: () => void
  onImport?: (file: File) => void
}

export function OnboardingDialog({ onDone, onImport }: Props) {
  const [step, setStep] = useState(0)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const slide = SLIDES[step]
  const isFirst = step === 0
  const isLast = step === SLIDES.length - 1

  // ESC closes the onboarding (treated as "skip").
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDone])

  // Move keyboard focus to the dialog when it opens / when the step changes.
  useEffect(() => {
    dialogRef.current?.focus()
  }, [step])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="no-print fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full sm:max-w-md sm:m-4 bg-surface text-fg shadow-xl rounded-t-3xl sm:rounded-2xl outline-none animate-scale-fade-in"
      >
        <div key={slide.key} className="px-6 pt-8 pb-4 text-center animate-fade-in">
          <div className="text-6xl mb-4" aria-hidden>
            {slide.icon}
          </div>
          <h2 id="onboarding-title" className="text-2xl font-bold mb-2">
            {slide.title}
          </h2>
          <p className="text-fg-muted text-base leading-relaxed">{slide.body}</p>
        </div>

        <div className="flex items-center gap-1.5 justify-center pb-4" aria-hidden>
          {SLIDES.map((s, i) => (
            <span
              key={s.key}
              className={
                'h-2 rounded-full transition-all ' +
                (i === step ? 'w-6 bg-brand' : 'w-2 bg-border-strong')
              }
            />
          ))}
        </div>

        <footer className="px-4 pb-5 pt-1 flex items-center justify-between gap-3 border-t border-border">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="btn-ghost"
              >
                Zurück
              </button>
            )}
            <button
              type="button"
              onClick={onDone}
              className="text-sm text-fg-muted hover:text-fg underline px-2 min-h-[44px]"
            >
              Überspringen
            </button>
          </div>
          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
              className="btn-primary"
              autoFocus
            >
              Weiter
              <span aria-hidden>→</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {onImport && (
                <label className="btn-secondary cursor-pointer">
                  Turnier importieren
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        onImport(f)
                        onDone()
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
              <button
                type="button"
                onClick={onDone}
                className="btn-primary"
                autoFocus
              >
                Loslegen
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
