import type { Tournament } from '../types'
import { MODE_LABELS } from '../types'

interface Props {
  tournament: Tournament
}

export function PrintView({ tournament }: Props) {
  const byId = new Map(tournament.players.map((p) => [p.id, p]))
  const name = (id: string) => byId.get(id)?.name ?? '?'

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
          disabled={tournament.schedule.length === 0}
        >
          Drucken
        </button>
        <p className="text-sm text-slate-500">
          Tipp: Im Druck-Dialog „Hintergrundgrafiken“ aktivieren, falls
          gewünscht.
        </p>
      </div>

      {tournament.schedule.length === 0 ? (
        <p className="text-slate-500 text-sm italic">
          Noch kein Spielplan zum Drucken — zuerst auf der Spielplan-Seite
          generieren.
        </p>
      ) : (
        <div className="bg-white p-6 rounded-md border border-slate-200">
          <header className="mb-4 border-b border-slate-300 pb-3">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-slate-600">
              {MODE_LABELS[tournament.mode]} · {tournament.courts} Plätze ·{' '}
              {tournament.rounds} Runden · {tournament.players.length}{' '}
              Spieler:innen
            </p>
          </header>

          {tournament.schedule.map((round) => (
            <section key={round.index} className="mb-5">
              <h2 className="text-lg font-semibold mb-2">
                Runde {round.index}
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-300 px-2 py-1 w-16">
                      Platz
                    </th>
                    <th className="border border-slate-300 px-2 py-1">
                      Team A
                    </th>
                    <th className="border border-slate-300 px-2 py-1 w-20 text-center">
                      Ergebnis
                    </th>
                    <th className="border border-slate-300 px-2 py-1">
                      Team B
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {round.matches.map((m) => (
                    <tr key={m.court}>
                      <td className="border border-slate-300 px-2 py-1 font-medium">
                        {m.court}
                      </td>
                      <td className="border border-slate-300 px-2 py-1">
                        {m.teamA.players.map(name).join(' & ')}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-center tabular-nums">
                        {m.scoreA != null && m.scoreB != null
                          ? `${m.scoreA} : ${m.scoreB}`
                          : '___ : ___'}
                      </td>
                      <td className="border border-slate-300 px-2 py-1">
                        {m.teamB.players.map(name).join(' & ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {round.resting.length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  Pause: {round.resting.map(name).join(', ')}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
