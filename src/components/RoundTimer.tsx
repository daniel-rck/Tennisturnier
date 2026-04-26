import { useEffect, useRef, useState } from 'react'
import { ringBell, unlockAudio } from '../bell'

interface Props {
  minutes: number
  onMinutesChange: (n: number) => void
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function RoundTimer({ minutes, onMinutesChange }: Props) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const endAtRef = useRef<number | null>(null)
  const rangRef = useRef(false)

  useEffect(() => {
    if (!running) setRemaining(minutes * 60)
  }, [minutes, running])

  useEffect(() => {
    if (!running) return
    const tick = () => {
      if (endAtRef.current == null) return
      const rem = (endAtRef.current - Date.now()) / 1000
      setRemaining(rem)
      if (rem <= 0 && !rangRef.current) {
        rangRef.current = true
        void ringBell(3)
        setRunning(false)
        endAtRef.current = null
      }
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [running])

  const start = () => {
    unlockAudio()
    rangRef.current = false
    const base = remaining > 0 ? remaining : minutes * 60
    endAtRef.current = Date.now() + base * 1000
    setRemaining(base)
    setRunning(true)
  }
  const pause = () => {
    setRunning(false)
    endAtRef.current = null
  }
  const reset = () => {
    setRunning(false)
    endAtRef.current = null
    rangRef.current = false
    setRemaining(minutes * 60)
  }

  const expired = remaining <= 0 && !running

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={
            'font-mono text-3xl tabular-nums ' +
            (expired ? 'text-rose-600' : 'text-slate-800')
          }
          aria-live="polite"
        >
          {fmt(remaining)}
        </div>
        <div className="flex gap-2">
          {!running ? (
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-emerald-700"
            >
              {remaining > 0 && remaining < minutes * 60
                ? 'Weiter'
                : 'Start'}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white font-medium hover:bg-amber-600"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              unlockAudio()
              void ringBell(1)
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-500"
            title="Glocke testen"
          >
            🔔
          </button>
        </div>
        <div className="flex-1" />
        <label className="text-sm text-slate-600 flex items-center gap-2">
          Spielzeit
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            disabled={running}
            onChange={(e) =>
              onMinutesChange(Math.max(1, Math.min(120, Number(e.target.value))))
            }
            className="w-16 rounded-md border border-slate-300 px-2 py-1 disabled:bg-slate-100"
          />
          min
        </label>
      </div>
      {expired && (
        <p className="mt-2 text-sm text-rose-700">
          Zeit abgelaufen – Glocke geklingelt. „Reset“ für die nächste Runde.
        </p>
      )}
    </div>
  )
}
