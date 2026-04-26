import type { Mode } from '../types'
import { MODE_LABELS } from '../types'

interface Props {
  name: string
  courts: number
  rounds: number
  mode: Mode
  onName: (s: string) => void
  onCourts: (n: number) => void
  onRounds: (n: number) => void
  onMode: (m: Mode) => void
  onReset: () => void
}

export function SetupPanel({
  name,
  courts,
  rounds,
  mode,
  onName,
  onCourts,
  onRounds,
  onMode,
  onReset,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Turniername
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Anzahl Plätze
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={courts}
            onChange={(e) => onCourts(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Anzahl Runden
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={rounds}
            onChange={(e) => onRounds(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Spielmodus
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMode(m)}
              className={
                'rounded-md border px-3 py-2 text-sm transition ' +
                (mode === m
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium'
                  : 'border-slate-300 hover:border-emerald-400')
              }
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                'Wirklich alles zurücksetzen? Spieler:innen und Spielplan gehen verloren.',
              )
            )
              onReset()
          }}
          className="text-sm text-rose-700 hover:text-rose-900 underline"
        >
          Turnier zurücksetzen
        </button>
      </div>
    </div>
  )
}
