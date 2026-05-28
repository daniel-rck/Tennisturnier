import type { Entry, Tournament } from '../types'
import { FORMAT_KEYS, MODE_KEYS } from '../types'
import {
  assignGroups,
  groupStandings,
  resolveGroupAssignment,
} from '../groupScheduler'
import { groupLetter, resolveBracket } from '../knockoutScheduler'
import { computeKnockoutPodium, computeRotationRanking } from '../ranking'
import { useTranslation, type TranslationKey } from '../i18n'
import { EmptyState } from './EmptyState'

function groupsFor(t: Tournament): Entry[][] {
  if (t.groupAssignment.length === t.groupCount) {
    return resolveGroupAssignment(t.entries, t.groupAssignment)
  }
  return assignGroups(t.entries, t.groupCount).groups
}

interface Props {
  tournament: Tournament
}

export function PrintView({ tournament }: Props) {
  const { t } = useTranslation()
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
          className="rounded-md bg-brand px-4 py-2 text-white text-sm font-medium hover:bg-brand-hover"
          disabled={!hasContent}
        >
          {t('print.button')}
        </button>
        <p className="text-sm text-fg-muted">{t('print.tip')}</p>
      </div>

      {!hasContent ? (
        <EmptyState
          icon="🖨"
          title={t('print.empty.title')}
          description={t('print.empty.description')}
        />
      ) : (
        <div className="bg-surface p-6 rounded-md border border-border">
          <header className="mb-4 border-b border-border-strong pb-3">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-sm text-fg-muted">
              {t(FORMAT_KEYS[f])}
              {f === 'rotation' && ` · ${t(MODE_KEYS[tournament.mode])}`}
              {' · '}
              {t('print.subtitleCourts', { count: tournament.courts })}
              {f === 'rotation' &&
                ` · ${t('print.subtitleRounds', { count: tournament.rounds })}`}
              {' · '}
              {f === 'rotation'
                ? t('print.subtitlePlayers', { count: tournament.players.length })
                : t('print.subtitleTeams', { count: tournament.entries.length })}
            </p>
          </header>

          <RankingPrint t={tournament} />

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
  const { t: tr } = useTranslation()
  const byId = new Map(t.players.map((p) => [p.id, p]))
  const name = (id: string) => byId.get(id)?.name ?? '?'
  return (
    <>
      {t.schedule.map((round) => (
        <section key={round.index} className="mb-5">
          <h2 className="text-lg font-semibold mb-2">
            {tr('schedule.round', { n: round.index })}
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-sunken text-left">
                <th className="border border-border-strong px-2 py-1 w-16">{tr('print.col.court')}</th>
                <th className="border border-border-strong px-2 py-1">{tr('print.col.teamA')}</th>
                <th className="border border-border-strong px-2 py-1 w-20 text-center">
                  {tr('print.col.result')}
                </th>
                <th className="border border-border-strong px-2 py-1">{tr('print.col.teamB')}</th>
              </tr>
            </thead>
            <tbody>
              {round.matches.map((m) => (
                <tr key={m.court}>
                  <td className="border border-border-strong px-2 py-1 font-medium">
                    {m.court}
                  </td>
                  <td className="border border-border-strong px-2 py-1">
                    {m.teamA.players.map(name).join(' & ')}
                  </td>
                  <td className="border border-border-strong px-2 py-1 text-center tabular-nums">
                    {m.scoreA != null && m.scoreB != null
                      ? `${m.scoreA} : ${m.scoreB}`
                      : '___ : ___'}
                  </td>
                  <td className="border border-border-strong px-2 py-1">
                    {m.teamB.players.map(name).join(' & ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {round.resting.length > 0 && (
            <p className="mt-1 text-xs text-fg-muted">
              {tr('schedule.rest', { names: round.resting.map(name).join(', ') })}
            </p>
          )}
        </section>
      ))}
    </>
  )
}

function GroupsPrint({ t }: { t: Tournament }) {
  const { t: tr } = useTranslation()
  const groups = groupsFor(t)
  const byId = new Map(t.entries.map((e) => [e.id, e]))
  return (
    <>
      <h2 className="text-lg font-semibold mb-2">{tr('print.heading.groups')}</h2>
      {groups.map((group, gi) => {
        const groupNum = gi + 1
        const matches = t.groupSchedule.filter((m) => m.group === groupNum)
        const standings = groupStandings(group, matches)
        return (
          <section key={gi} className="mb-5">
            <h3 className="font-semibold mb-2">
              {tr('ranking.groupHeading', { letter: groupLetter(groupNum) })}
            </h3>
            <table className="w-full text-xs border-collapse mb-2">
              <thead>
                <tr className="bg-surface-sunken text-left">
                  <th className="border border-border-strong px-1 py-1 w-8">#</th>
                  <th className="border border-border-strong px-1 py-1">{tr('ranking.col.name')}</th>
                  <th className="border border-border-strong px-1 py-1 text-right">
                    {tr('ranking.col.playedShort')}
                  </th>
                  <th className="border border-border-strong px-1 py-1 text-right">
                    {tr('ranking.col.winsShort')}
                  </th>
                  <th className="border border-border-strong px-1 py-1 text-right">
                    {tr('ranking.col.gamesShort')}
                  </th>
                  <th className="border border-border-strong px-1 py-1 text-right">
                    {tr('ranking.col.diff')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.entryId}>
                    <td className="border border-border-strong px-1 py-1 font-semibold">
                      {s.rank}.
                    </td>
                    <td className="border border-border-strong px-1 py-1">
                      {s.name}
                    </td>
                    <td className="border border-border-strong px-1 py-1 text-right">
                      {s.played}
                    </td>
                    <td className="border border-border-strong px-1 py-1 text-right">
                      {s.wins}
                    </td>
                    <td className="border border-border-strong px-1 py-1 text-right tabular-nums">
                      {s.gamesFor}:{s.gamesAgainst}
                    </td>
                    <td className="border border-border-strong px-1 py-1 text-right tabular-nums">
                      {s.diff > 0 ? '+' : ''}
                      {s.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface-sunken text-left">
                  <th className="border border-border-strong px-1 py-1">{tr('print.col.teamA')}</th>
                  <th className="border border-border-strong px-1 py-1 w-20 text-center">
                    {tr('print.col.result')}
                  </th>
                  <th className="border border-border-strong px-1 py-1">{tr('print.col.teamB')}</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.matchIndex}>
                    <td className="border border-border-strong px-1 py-1">
                      {byId.get(m.entryA)?.name}
                    </td>
                    <td className="border border-border-strong px-1 py-1 text-center tabular-nums">
                      {m.scoreA != null && m.scoreB != null
                        ? `${m.scoreA} : ${m.scoreB}`
                        : '___ : ___'}
                    </td>
                    <td className="border border-border-strong px-1 py-1">
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

const ROUND_KEYS: Record<number | 'other', TranslationKey> = {
  0: 'bracket.roundFinal',
  1: 'bracket.roundSemi',
  2: 'bracket.roundQuarter',
  3: 'bracket.roundEighth',
  other: 'bracket.roundOther',
}

function BracketPrint({ t }: { t: Tournament }) {
  const { t: tr } = useTranslation()
  const entryName = (id: string) =>
    t.entries.find((e) => e.id === id)?.name ?? '?'
  let groupWinners: ((g: number, r: number) => string | undefined) | undefined
  if (t.format === 'groups-ko') {
    const groups = groupsFor(t)
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
  const resolved = resolveBracket(t.bracket, entryName, groupWinners, tr)
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
      <h2 className="text-lg font-semibold mb-2 mt-4">{tr('print.heading.bracket')}</h2>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-surface-sunken text-left">
            <th className="border border-border-strong px-1 py-1 w-24">{tr('print.col.round')}</th>
            <th className="border border-border-strong px-1 py-1">{tr('print.col.teamA')}</th>
            <th className="border border-border-strong px-1 py-1 w-20 text-center">
              {tr('print.col.result')}
            </th>
            <th className="border border-border-strong px-1 py-1">{tr('print.col.teamB')}</th>
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((rn) =>
            rounds.get(rn)!.map((m) => (
              <tr key={m.matchId}>
                <td className="border border-border-strong px-1 py-1">
                  {bracketRoundLabel(tr, rn, last)} ({m.matchId})
                </td>
                <td className="border border-border-strong px-1 py-1">
                  {m.pendingA}
                </td>
                <td className="border border-border-strong px-1 py-1 text-center tabular-nums">
                  {m.isByeMatch
                    ? tr('bracket.bye')
                    : m.scoreA != null && m.scoreB != null
                      ? `${m.scoreA} : ${m.scoreB}`
                      : '___ : ___'}
                </td>
                <td className="border border-border-strong px-1 py-1">
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

function bracketRoundLabel(
  tr: (key: TranslationKey, vars?: Record<string, string | number>) => string,
  round: number,
  last: number,
): string {
  const offset = last - round
  const key = ROUND_KEYS[offset as 0 | 1 | 2 | 3] ?? ROUND_KEYS.other
  if (key === ROUND_KEYS.other) return tr(key, { n: round, count: 0 })
  return tr(key)
}

function RankingPrint({ t }: { t: Tournament }) {
  if (t.format === 'rotation') return <RotationRankingPrint t={t} />
  if (t.format === 'groups') return <GroupsRankingPrint t={t} />
  return <KnockoutRankingPrint t={t} />
}

function medalForPrint(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

function RotationRankingPrint({ t }: { t: Tournament }) {
  const { t: tr } = useTranslation()
  const rows = computeRotationRanking(t.schedule, t.players)
  if (rows.length === 0) return null
  return (
    <section className="mb-5">
      <h2 className="text-lg font-semibold mb-2">{tr('print.heading.standings')}</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-sunken text-left">
            <th className="border border-border-strong px-2 py-1 w-12">#</th>
            <th className="border border-border-strong px-2 py-1">{tr('print.col.player')}</th>
            <th className="border border-border-strong px-2 py-1 w-12 text-right">
              {tr('ranking.col.playedShort')}
            </th>
            <th className="border border-border-strong px-2 py-1 w-12 text-right">
              {tr('ranking.col.winsShort')}
            </th>
            <th className="border border-border-strong px-2 py-1 w-12 text-right">
              {tr('ranking.col.drawsShort')}
            </th>
            <th className="border border-border-strong px-2 py-1 w-12 text-right">
              {tr('ranking.col.lossesShort')}
            </th>
            <th className="border border-border-strong px-2 py-1 w-20 text-right">
              {tr('ranking.col.gamesShort')}
            </th>
            <th className="border border-border-strong px-2 py-1 w-14 text-right">
              {tr('ranking.col.diff')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border border-border-strong px-2 py-1 font-semibold">
                {medalForPrint(r.rank)} {r.rank}.
              </td>
              <td className="border border-border-strong px-2 py-1">{r.name}</td>
              <td className="border border-border-strong px-2 py-1 text-right">
                {r.played}
              </td>
              <td className="border border-border-strong px-2 py-1 text-right">
                {r.wins}
              </td>
              <td className="border border-border-strong px-2 py-1 text-right">
                {r.draws}
              </td>
              <td className="border border-border-strong px-2 py-1 text-right">
                {r.losses}
              </td>
              <td className="border border-border-strong px-2 py-1 text-right tabular-nums">
                {r.gamesFor}:{r.gamesAgainst}
              </td>
              <td className="border border-border-strong px-2 py-1 text-right tabular-nums">
                {r.diff > 0 ? '+' : ''}
                {r.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function GroupsRankingPrint({ t }: { t: Tournament }) {
  const { t: tr } = useTranslation()
  const groups = groupsFor(t)
  const byId = new Map(t.entries.map((e) => [e.id, e]))
  const winners: Array<{ group: number; name: string }> = []
  groups.forEach((group, gi) => {
    const matches = t.groupSchedule.filter((m) => m.group === gi + 1)
    const hasDecidedMatch = matches.some(
      (m) => m.scoreA != null && m.scoreB != null,
    )
    if (!hasDecidedMatch) return
    const standings = groupStandings(group, matches)
    const top = standings[0]
    if (top && byId.has(top.entryId)) {
      winners.push({ group: gi + 1, name: top.name })
    }
  })
  if (winners.length === 0) return null
  return (
    <section className="mb-5">
      <h2 className="text-lg font-semibold mb-2">{tr('print.heading.groupWinners')}</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-sunken text-left">
            <th className="border border-border-strong px-2 py-1 w-24">{tr('print.col.group')}</th>
            <th className="border border-border-strong px-2 py-1">{tr('print.col.winner')}</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((w) => (
            <tr key={w.group}>
              <td className="border border-border-strong px-2 py-1 font-medium">
                {tr('ranking.groupHeading', { letter: groupLetter(w.group) })}
              </td>
              <td className="border border-border-strong px-2 py-1">{w.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function KnockoutRankingPrint({ t }: { t: Tournament }) {
  const { t: tr } = useTranslation()
  const entryName = (id: string) =>
    t.entries.find((e) => e.id === id)?.name ?? '?'
  let groupWinners: ((g: number, r: number) => string | undefined) | undefined
  if (t.format === 'groups-ko') {
    const groups = groupsFor(t)
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
  const resolved = resolveBracket(t.bracket, entryName, groupWinners, tr)
  const podium = computeKnockoutPodium(resolved, entryName)
  if (!podium.champion) return null
  return (
    <section className="mb-5">
      <h2 className="text-lg font-semibold mb-2">{tr('print.heading.standings')}</h2>
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr>
            <td className="border border-border-strong px-2 py-1 w-32 font-semibold bg-surface-sunken">
              {tr('print.podium.gold')}
            </td>
            <td className="border border-border-strong px-2 py-1 font-semibold">
              {podium.champion}
            </td>
          </tr>
          {podium.runnerUp && (
            <tr>
              <td className="border border-border-strong px-2 py-1 font-semibold bg-surface-sunken">
                {tr('print.podium.silver')}
              </td>
              <td className="border border-border-strong px-2 py-1">
                {podium.runnerUp}
              </td>
            </tr>
          )}
          {podium.thirds.length > 0 && (
            <tr>
              <td className="border border-border-strong px-2 py-1 font-semibold bg-surface-sunken">
                {tr('print.podium.bronze')}
              </td>
              <td className="border border-border-strong px-2 py-1">
                {podium.thirds.join(', ')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
