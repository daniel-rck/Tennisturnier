import type { EntryFormat, Format, Mode } from '../types'
import {
  ENTRY_FORMAT_LABELS,
  FORMAT_LABELS,
  MODE_LABELS,
} from '../types'

interface Props {
  name: string
  format: Format
  entryFormat: EntryFormat
  courts: number
  rounds: number
  mode: Mode
  groupCount: number
  advancePerGroup: number
  onName: (s: string) => void
  onFormat: (f: Format) => void
  onEntryFormat: (f: EntryFormat) => void
  onCourts: (n: number) => void
  onRounds: (n: number) => void
  onMode: (m: Mode) => void
  onGroupCount: (n: number) => void
  onAdvancePerGroup: (n: number) => void
  onReset: () => void
}

export function SetupPanel({
  name,
  format,
  entryFormat,
  courts,
  rounds,
  mode,
  groupCount,
  advancePerGroup,
  onName,
  onFormat,
  onEntryFormat,
  onCourts,
  onRounds,
  onMode,
  onGroupCount,
  onAdvancePerGroup,
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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Turnierformat
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormat(f)}
              className={
                'rounded-md border px-3 py-2 text-sm transition text-left ' +
                (format === f
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium'
                  : 'border-slate-300 hover:border-emerald-400')
              }
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {format === 'rotation' &&
            'Wechselturnier mit rotierenden Mixed-Doppeln. Jede Runde alle Plätze besetzt.'}
          {format === 'groups' &&
            'Gruppenphase mit Jeder-gegen-Jeden in jeder Gruppe. Tabelle pro Gruppe.'}
          {format === 'knockout' &&
            'KO-System ab Runde 1. Bracket mit Freilosen, falls die Anzahl Teilnehmer keine 2er-Potenz ist.'}
          {format === 'groups-ko' &&
            'Gruppenphase + Endrunde im KO. Die besten N pro Gruppe steigen ins Bracket auf.'}
        </p>
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

        {format === 'rotation' && (
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
        )}
      </div>

      {format === 'rotation' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Doppel-Modus
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
      )}

      {(format === 'groups' || format === 'knockout' || format === 'groups-ko') && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Teilnehmer-Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ENTRY_FORMAT_LABELS) as EntryFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onEntryFormat(f)}
                className={
                  'rounded-md border px-3 py-2 text-sm transition ' +
                  (entryFormat === f
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-medium'
                    : 'border-slate-300 hover:border-emerald-400')
                }
              >
                {ENTRY_FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      {(format === 'groups' || format === 'groups-ko') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Anzahl Gruppen
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={groupCount}
              onChange={(e) => onGroupCount(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          {format === 'groups-ko' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Aufsteiger pro Gruppe
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={advancePerGroup}
                onChange={(e) => onAdvancePerGroup(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (
              confirm(
                'Wirklich alles zurücksetzen? Spieler:innen, Teams und Spielplan gehen verloren.',
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
