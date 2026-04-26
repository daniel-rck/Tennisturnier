import type { Tournament } from '../types'
import { FORMAT_LABELS, MODE_LABELS } from '../types'
import { assignGroups, groupStandings } from '../groupScheduler'
import { groupLetter, resolveBracket } from '../knockoutScheduler'

interface Props {
  tournament: Tournament
}

export function PrintView({ tournament }: Props) {
  const f = tournament.format
  const hasContent =
    (f === 'rotation' && tournament.schedule.length > 0) ||
    ((f === 'groups' || f === 'groups-ko') &&
      tournament.entries.length > 0) ||
    ((f === 'knockout' || f === 'groups-ko') &&
      tournament.bracket.length > 0)

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
          disabled={!hasContent}
        >
          Drucken
        </button>
        <p className="text-sm text-slate-500">
          Tipp: Im Druck-Dialog „Hintergrundgrafiken“ aktivieren, falls
          gewünscht.
        </p>
      </div>

      {!hasContent ? (
        <p className="text-slate-500 text-sm italic">
          Noch nichts zum Drucken — zuerst Spielplan / Bracket erzeugen.
        </p>
      ) : (
        <div className="bg-white p-6 rounded-md border border-slate-200">
          <header className="mb-4 border-b border-slate-300 pb-3">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-slate-600">
              {FORMAT_LABELS[f]}
              {f === 'rotation' && ` · ${MODE_LABELS[tournament.mode]}`}
              {' · '}
              {tournament.courts} Plätze
              {f === 'rotation' && ` · ${tournament.rounds} Runden`}
              {' · '}
              {f === 'rotation'
                ? `${tournament.players.length} Spieler:innen`
                : `${tournament.entries.length} Teams`}
            </p>
          </header>

          {f === 'rotation' && <RotationPrint t={tournament} />}
          {f === 'groups' && <GroupsPrint t={tournament} />}
          {f === 'knockout' && <BracketPrint t={tournament} />}
          {f === 'groups-ko' && (
            <>
              <GroupsPrint t={tournament} />
              <BracketPrint t={tournament} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RotationPrint({ t }: { t: Tournament }) {
  const byId = new Map(t.players.map((p) => [p.id, p]))
  const name = (id: string) => byId.get(id)?.name ?? '?'
  return (
    <>
      {t.schedule.map((round) => (
        <section key={round.index} className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Runde {round.index}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 px-2 py-1 w-16">Platz</th>
                <th className="border border-slate-300 px-2 py-1">Team A</th>
                <th className="border border-slate-300 px-2 py-1 w-20 text-center">
                  Ergebnis
                </th>
                <th className="border border-slate-300 px-2 py-1">Team B</th>
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
    </>
  )
}

function GroupsPrint({ t }: { t: Tournament }) {
  const { groups } = assignGroups(t.entries, t.groupCount)
  const byId = new Map(t.entries.map((e) => [e.id, e]))
  return (
    <>
      <h2 className="text-lg font-semibold mb-2">Gruppenphase</h2>
      {groups.map((group, gi) => {
        const groupNum = gi + 1
        const matches = t.groupSchedule.filter((m) => m.group === groupNum)
        const standings = groupStandings(group, matches)
        return (
          <section key={gi} className="mb-5">
            <h3 className="font-semibold mb-2">
              Gruppe {groupLetter(groupNum)}
            </h3>
            <table className="w-full text-xs border-collapse mb-2">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-300 px-1 py-1 w-8">#</th>
                  <th className="border border-slate-300 px-1 py-1">Name</th>
                  <th className="border border-slate-300 px-1 py-1 text-right">
                    Sp
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-right">
                    S
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-right">
                    Spiele
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-right">
                    Diff
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.entryId}>
                    <td className="border border-slate-300 px-1 py-1 font-semibold">
                      {s.rank}.
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      {s.name}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {s.played}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {s.wins}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                      {s.gamesFor}:{s.gamesAgainst}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right tabular-nums">
                      {s.diff > 0 ? '+' : ''}
                      {s.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-300 px-1 py-1">Team A</th>
                  <th className="border border-slate-300 px-1 py-1 w-20 text-center">
                    Ergebnis
                  </th>
                  <th className="border border-slate-300 px-1 py-1">Team B</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.matchIndex}>
                    <td className="border border-slate-300 px-1 py-1">
                      {byId.get(m.entryA)?.name}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-center tabular-nums">
                      {m.scoreA != null && m.scoreB != null
                        ? `${m.scoreA} : ${m.scoreB}`
                        : '___ : ___'}
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      {byId.get(m.entryB)?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </>
  )
}

function BracketPrint({ t }: { t: Tournament }) {
  const entryName = (id: string) =>
    t.entries.find((e) => e.id === id)?.name ?? '?'
  let groupWinners: ((g: number, r: number) => string | undefined) | undefined
  if (t.format === 'groups-ko') {
    const { groups } = assignGroups(t.entries, t.groupCount)
    const map = new Map<string, string>()
    groups.forEach((g, gi) => {
      const standings = groupStandings(
        g,
        t.groupSchedule.filter((m) => m.group === gi + 1),
      )
      standings.forEach((s, ri) => map.set(`${gi + 1}|${ri + 1}`, s.entryId))
    })
    groupWinners = (g, r) => map.get(`${g}|${r}`)
  }
  const resolved = resolveBracket(t.bracket, entryName, groupWinners)
  if (resolved.length === 0) return null
  const last = resolved[resolved.length - 1].round
  const rounds = new Map<number, typeof resolved>()
  for (const m of resolved) {
    if (!rounds.has(m.round)) rounds.set(m.round, [])
    rounds.get(m.round)!.push(m)
  }
  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b)
  return (
    <>
      <h2 className="text-lg font-semibold mb-2 mt-4">Bracket</h2>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border border-slate-300 px-1 py-1 w-24">Runde</th>
            <th className="border border-slate-300 px-1 py-1">Team A</th>
            <th className="border border-slate-300 px-1 py-1 w-20 text-center">
              Ergebnis
            </th>
            <th className="border border-slate-300 px-1 py-1">Team B</th>
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((rn) =>
            rounds.get(rn)!.map((m) => (
              <tr key={m.matchId}>
                <td className="border border-slate-300 px-1 py-1">
                  {bracketRoundLabel(rn, last)} ({m.matchId})
                </td>
                <td className="border border-slate-300 px-1 py-1">
                  {m.pendingA}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-center tabular-nums">
                  {m.isByeMatch
                    ? 'Freilos'
                    : m.scoreA != null && m.scoreB != null
                      ? `${m.scoreA} : ${m.scoreB}`
                      : '___ : ___'}
                </td>
                <td className="border border-slate-300 px-1 py-1">
                  {m.pendingB}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </>
  )
}

function bracketRoundLabel(round: number, last: number) {
  if (round === last) return 'Finale'
  if (round === last - 1) return 'Halbfinale'
  if (round === last - 2) return 'Viertelfinale'
  if (round === last - 3) return 'Achtelfinale'
  return `Runde ${round}`
}
