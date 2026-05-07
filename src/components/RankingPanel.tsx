import { useCallback, useMemo } from 'react'
import type {
  Entry,
  RevealCategory,
  RevealStep,
  Tournament,
} from '../types'
import {
  assignGroups,
  groupStandings,
  resolveGroupAssignment,
} from '../groupScheduler'
import { groupLetter, resolveBracket } from '../knockoutScheduler'
import { computeKnockoutPodium, computeRotationRanking } from '../ranking'
import type { RotationRanking } from '../ranking'
import { useTranslation } from '../i18n'
import { RevealPanel } from './RevealPanel'
import { EmptyState } from './EmptyState'

function groupsFor(t: Tournament): Entry[][] {
  if (t.groupAssignment.length === t.groupCount) {
    return resolveGroupAssignment(t.entries, t.groupAssignment)
  }
  return assignGroups(t.entries, t.groupCount).groups
}

interface Props {
  tournament: Tournament
  isOwner?: boolean
  onSetRevealActive?: (b: boolean) => void
  onSetRevealStep?: (cat: RevealCategory, step: RevealStep) => void
  onResetReveal?: () => void
}

export function RankingPanel({
  tournament,
  isOwner = true,
  onSetRevealActive,
  onSetRevealStep,
  onResetReveal,
}: Props) {
  const { t } = useTranslation()
  const f = tournament.format

  if (tournament.reveal.active && onSetRevealActive && onSetRevealStep && onResetReveal) {
    return (
      <RevealPanel
        tournament={tournament}
        isOwner={isOwner}
        onStep={onSetRevealStep}
        onReset={onResetReveal}
        onClose={() => onSetRevealActive(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {f === 'rotation' && isOwner && onSetRevealActive && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSetRevealActive(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm text-white font-medium hover:bg-brand-hover"
          >
            {t('ranking.startReveal')}
          </button>
        </div>
      )}
      {f === 'rotation' && <RotationRanking tournament={tournament} />}
      {f === 'groups' && <GroupsRanking tournament={tournament} />}
      {f === 'knockout' && <KnockoutRanking tournament={tournament} />}
      {f === 'groups-ko' && <GroupsKoRanking tournament={tournament} />}
    </div>
  )
}

type RotationRow = RotationRanking

function RotationRanking({ tournament }: Props) {
  const { t } = useTranslation()
  const rows = useMemo(
    () => computeRotationRanking(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  )
  const completed = tournament.schedule.flatMap((r) => r.matches).filter(
    (m) => m.scoreA != null && m.scoreB != null,
  ).length
  const total = tournament.schedule.flatMap((r) => r.matches).length

  const showPerGender =
    tournament.mode === 'mixed' && tournament.perGenderRanking
  const playerGender = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p.gender])),
    [tournament.players],
  )
  const womenRows = useMemo(
    () =>
      showPerGender ? rerank(rows.filter((r) => playerGender.get(r.id) === 'F')) : [],
    [rows, playerGender, showPerGender],
  )
  const menRows = useMemo(
    () =>
      showPerGender ? rerank(rows.filter((r) => playerGender.get(r.id) === 'M')) : [],
    [rows, playerGender, showPerGender],
  )

  if (tournament.schedule.length === 0)
    return (
      <EmptyState
        icon="📋"
        title={t('ranking.empty.scheduleTitle')}
        description={t('ranking.empty.scheduleDescription')}
      />
    )
  if (completed === 0)
    return (
      <EmptyState
        icon="📝"
        title={t('ranking.empty.resultsTitle')}
        description={t('ranking.empty.resultsDescription')}
      />
    )

  const podium = rows.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="text-sm text-fg-muted">
        {t('ranking.matchesProgress', { done: completed, total })}
        {completed < total && t('ranking.liveSuffix')}
      </div>
      <section className="space-y-4">
        {showPerGender && (
          <h3 className="text-base font-semibold text-fg">
            {t('ranking.overall')}
          </h3>
        )}
        {podium.length >= 3 && <Podium podium={podium.map(rowToPodium)} />}
        <RankingTable rows={rows.map(rowToTableRow)} />
      </section>
      {showPerGender && (
        <GenderRanking title={t('ranking.women')} rows={womenRows} />
      )}
      {showPerGender && (
        <GenderRanking title={t('ranking.men')} rows={menRows} />
      )}
    </div>
  )
}

function GenderRanking({
  title,
  rows,
}: {
  title: string
  rows: RotationRow[]
}) {
  if (rows.length === 0) return null
  const podium = rows.slice(0, 3)
  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {podium.length >= 3 && <Podium podium={podium.map(rowToPodium)} />}
      <RankingTable rows={rows.map(rowToTableRow)} />
    </section>
  )
}

function rowToTableRow(r: RotationRow): TableRow {
  return {
    rank: r.rank,
    name: r.name,
    played: r.played,
    wins: r.wins,
    draws: r.draws,
    losses: r.losses,
    for: r.gamesFor,
    against: r.gamesAgainst,
    diff: r.diff,
  }
}

function rerank(rows: RotationRow[]): RotationRow[] {
  const next = rows.map((r) => ({ ...r }))
  let i = 0
  while (i < next.length) {
    let j = i + 1
    while (
      j < next.length &&
      next[j].wins === next[i].wins &&
      next[j].diff === next[i].diff &&
      next[j].gamesFor === next[i].gamesFor
    )
      j++
    for (let k = i; k < j; k++) next[k].rank = i + 1
    i = j
  }
  return next
}

function GroupsRanking({ tournament }: Props) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupsFor(tournament), [tournament])
  if (tournament.entries.length === 0)
    return (
      <EmptyState
        icon="👥"
        title={t('ranking.empty.entriesTitle')}
        description={t('ranking.empty.entriesDescription')}
      />
    )

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">{t('ranking.groupsHint')}</p>
      {groups.map((group, gi) => {
        const groupNum = gi + 1
        const matches = tournament.groupSchedule.filter(
          (m) => m.group === groupNum,
        )
        const standings = groupStandings(group, matches)
        return (
          <div
            key={gi}
            className="rounded-md border border-border bg-surface p-3"
          >
            <h3 className="font-semibold mb-2">
              {t('ranking.groupHeading', { letter: groupLetter(groupNum) })}
            </h3>
            <RankingTable
              rows={standings.map((s) => ({
                rank: s.rank,
                name: s.name,
                played: s.played,
                wins: s.wins,
                draws: s.draws,
                losses: s.losses,
                for: s.gamesFor,
                against: s.gamesAgainst,
                diff: s.diff,
              }))}
            />
          </div>
        )
      })}
    </div>
  )
}

function KnockoutRanking({ tournament }: Props) {
  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )
  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName),
    [tournament.bracket, entryName],
  )
  return <BracketSummary resolved={resolved} entryName={entryName} />
}

function GroupsKoRanking({ tournament }: Props) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupsFor(tournament), [tournament])
  const groupWinnerMap = useMemo(() => {
    const map = new Map<string, string>()
    groups.forEach((g, gi) => {
      const standings = groupStandings(
        g,
        tournament.groupSchedule.filter((m) => m.group === gi + 1),
      )
      standings.forEach((s, ri) =>
        map.set(`${gi + 1}|${ri + 1}`, s.entryId),
      )
    })
    return map
  }, [groups, tournament.groupSchedule])

  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )
  const resolved = useMemo(
    () =>
      resolveBracket(tournament.bracket, entryName, (g, r) =>
        groupWinnerMap.get(`${g}|${r}`),
      ),
    [tournament.bracket, entryName, groupWinnerMap],
  )
  return (
    <div className="space-y-6">
      <BracketSummary resolved={resolved} entryName={entryName} />
      <details className="group">
        <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
          <span aria-hidden className="inline-block transition-transform group-open:rotate-90">▸</span>
          {t('ranking.groupTablesToggle')}
        </summary>
        <div className="mt-3 space-y-3">
          {groups.map((group, gi) => {
            const groupNum = gi + 1
            const matches = tournament.groupSchedule.filter(
              (m) => m.group === groupNum,
            )
            const standings = groupStandings(group, matches)
            return (
              <div
                key={gi}
                className="rounded-md border border-border bg-surface p-3"
              >
                <h3 className="font-semibold mb-2">
                  {t('ranking.groupHeading', { letter: groupLetter(groupNum) })}
                </h3>
                <RankingTable
                  rows={standings.map((s) => ({
                    rank: s.rank,
                    name: s.name,
                    played: s.played,
                    wins: s.wins,
                    draws: s.draws,
                    losses: s.losses,
                    for: s.gamesFor,
                    against: s.gamesAgainst,
                    diff: s.diff,
                  }))}
                />
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

function BracketSummary({
  resolved,
  entryName,
}: {
  resolved: ReturnType<typeof resolveBracket>
  entryName: (id: string) => string
}) {
  const { t } = useTranslation()
  if (resolved.length === 0)
    return (
      <EmptyState
        icon="🏆"
        title={t('ranking.empty.bracketTitle')}
        description={t('ranking.empty.bracketDescription')}
      />
    )
  const { champion, runnerUp, thirds } = computeKnockoutPodium(resolved, entryName)

  return (
    <div className="space-y-4">
      {champion ? (
        <div className="rounded-md bg-brand-soft border border-emerald-300 p-4 text-center">
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-xs text-brand font-medium uppercase tracking-wide">
            {t('ranking.champion')}
          </div>
          <div className="text-2xl font-bold text-brand-soft-fg">
            {champion}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border-strong bg-surface-muted px-4 py-3 text-center text-sm text-fg-muted">
          {t('ranking.finalPending')}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border p-3">
          <div className="text-xs text-fg-muted mb-1">{t('ranking.finalist')}</div>
          <div className="font-semibold">{runnerUp ?? t('common.dash')}</div>
        </div>
        <div className="rounded-md border border-border p-3">
          <div className="text-xs text-fg-muted mb-1">
            {t('ranking.semiLosers')}
          </div>
          <div className="font-semibold">
            {thirds.length > 0 ? thirds.join(', ') : t('common.dash')}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PodiumRow {
  name: string
  wins: number
  diff: number
}

function rowToPodium(r: RotationRow): PodiumRow {
  return { name: r.name, wins: r.wins, diff: r.diff }
}

function Podium({ podium }: { podium: PodiumRow[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <PodiumStep row={podium[1]} place={2} height="h-24" tone="bg-slate-300" />
      <PodiumStep row={podium[0]} place={1} height="h-32" tone="bg-warn-bg" />
      <PodiumStep row={podium[2]} place={3} height="h-20" tone="bg-orange-300" />
    </div>
  )
}

function PodiumStep({
  row,
  place,
  height,
  tone,
}: {
  row: PodiumRow
  place: number
  height: string
  tone: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl">{medal(place)}</div>
      <div className="font-semibold text-center text-sm">{row.name}</div>
      <div className="text-xs text-fg-muted">
        {t('ranking.podiumWinsDiff', {
          wins: row.wins,
          diff: (row.diff > 0 ? '+' : '') + row.diff,
        })}
      </div>
      <div
        className={`w-full ${height} ${tone} rounded-t-md flex items-center justify-center font-bold text-fg`}
      >
        {place}
      </div>
    </div>
  )
}

function medal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

interface TableRow {
  rank: number
  name: string
  played: number
  wins: number
  draws: number
  losses: number
  for: number
  against: number
  diff: number
}

function RankingTable({ rows }: { rows: TableRow[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full text-sm 2xl:text-lg">
        <thead>
          <tr className="bg-surface-sunken text-fg text-left">
            <th className="px-2 py-2 w-10">#</th>
            <th className="px-2 py-2">{t('ranking.col.name')}</th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.played')}>
              <abbr title={t('ranking.col.played')} className="no-underline">
                {t('ranking.col.playedShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.wins')}>
              <abbr title={t('ranking.col.wins')} className="no-underline">
                {t('ranking.col.winsShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.draws')}>
              <abbr title={t('ranking.col.draws')} className="no-underline">
                {t('ranking.col.drawsShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.losses')}>
              <abbr title={t('ranking.col.losses')} className="no-underline">
                {t('ranking.col.lossesShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.gamesTitle')}>
              {t('ranking.col.games')}
            </th>
            <th className="px-2 py-2 text-right" title={t('ranking.col.diffTitle')}>
              {t('ranking.col.diff')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-2 py-1.5 2xl:py-3 font-semibold">
                {medal(r.rank)} {r.rank}.
              </td>
              <td className="px-2 py-1.5 2xl:py-3">{r.name}</td>
              <td className="px-2 py-1.5 2xl:py-3 text-right">{r.played}</td>
              <td className="px-2 py-1.5 2xl:py-3 text-right text-brand">
                {r.wins}
              </td>
              <td className="px-2 py-1.5 2xl:py-3 text-right text-fg-muted">
                {r.draws}
              </td>
              <td className="px-2 py-1.5 2xl:py-3 text-right text-danger-fg">
                {r.losses}
              </td>
              <td className="px-2 py-1.5 2xl:py-3 text-right tabular-nums">
                {r.for}:{r.against}
              </td>
              <td className="px-2 py-1.5 2xl:py-3 text-right tabular-nums font-medium">
                {r.diff > 0 ? '+' : ''}
                {r.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
