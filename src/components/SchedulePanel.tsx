import { useMemo } from 'react'
import type { Player, Round, Tournament } from '../types'
import { MODE_LABELS } from '../types'

interface Props {
  tournament: Tournament
  onGenerate: () => void
  warnings: string[]
}

export function SchedulePanel({ tournament, onGenerate, warnings }: Props) {
  const playerById = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p])),
    [tournament.players],
  )

  const stats = useMemo(
    () => computeStats(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={tournament.players.length < 4}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Spielplan generieren
        </button>
        <div className="text-sm text-slate-600">
          Modus: <strong>{MODE_LABELS[tournament.mode]}</strong> ·{' '}
          {tournament.courts} Plätze · {tournament.rounds} Runden
        </div>
      </div>

      {tournament.players.length < 4 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Mindestens 4 Spieler:innen werden benötigt.
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li
              key={i}
              className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800"
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      {tournament.schedule.length === 0 ? (
        <p className="text-slate-500 text-sm italic">
          Noch kein Spielplan generiert.
        </p>
      ) : (
        <>
          <div className="grid gap-3">
            {tournament.schedule.map((round) => (
              <RoundCard key={round.index} round={round} byId={playerById} />
            ))}
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
              Statistik (Einsätze / Pausen pro Spieler:in)
            </summary>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1">Name</th>
                  <th className="py-1">Spiele</th>
                  <th className="py-1">Pausen</th>
                  <th className="py-1">Verschiedene Partner</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-1">{s.name}</td>
                    <td className="py-1">{s.plays}</td>
                    <td className="py-1">{s.rests}</td>
                    <td className="py-1">{s.uniquePartners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}

function RoundCard({
  round,
  byId,
}: {
  round: Round
  byId: Map<string, Player>
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Runde {round.index}</h3>
        {round.resting.length > 0 && (
          <span className="text-xs text-slate-500">
            Pause: {round.resting.map((id) => byId.get(id)?.name).join(', ')}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {round.matches.map((m) => (
          <div
            key={m.court}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div className="text-xs font-medium text-slate-500 mb-1">
              Platz {m.court}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>
                {m.teamA.players.map((id) => byId.get(id)?.name).join(' & ')}
              </span>
              <span className="text-slate-400 text-xs">vs.</span>
              <span>
                {m.teamB.players.map((id) => byId.get(id)?.name).join(' & ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Stat {
  id: string
  name: string
  plays: number
  rests: number
  uniquePartners: number
}

function computeStats(schedule: Round[], players: Player[]): Stat[] {
  const map = new Map<string, Stat & { partners: Set<string> }>()
  for (const p of players)
    map.set(p.id, {
      id: p.id,
      name: p.name,
      plays: 0,
      rests: 0,
      uniquePartners: 0,
      partners: new Set(),
    })
  for (const r of schedule) {
    for (const m of r.matches) {
      for (const team of [m.teamA.players, m.teamB.players]) {
        for (const id of team) {
          const s = map.get(id)
          if (!s) continue
          s.plays++
          for (const other of team) if (other !== id) s.partners.add(other)
        }
      }
    }
    for (const id of r.resting) {
      const s = map.get(id)
      if (s) s.rests++
    }
  }
  return Array.from(map.values()).map((s) => ({
    id: s.id,
    name: s.name,
    plays: s.plays,
    rests: s.rests,
    uniquePartners: s.partners.size,
  }))
}
