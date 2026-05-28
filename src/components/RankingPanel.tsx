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
import { Podium, type PodiumEntry } from './Podium'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Avatar } from './ui/Avatar'

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
    <div className="space-y-5">
      {f === 'rotation' && isOwner && onSetRevealActive && (
        <Card variant="elevated" className="bg-gold-soft border-gold/40 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-3xl shrink-0" aria-hidden>🎉</div>
            <div className="flex-1 min-w-[10rem]">
              <div className="serif font-semibold text-fg">{t('reveal.heading')}</div>
              <p className="text-xs text-fg-muted">{t('reveal.controllerHint')}</p>
            </div>
            <Button variant="gold" size="md" onClick={() => onSetRevealActive(true)}>
              {t('ranking.startReveal')}
            </Button>
          </div>
        </Card>
      )}
      {f === 'rotation' && <RotationRankingView tournament={tournament} />}
      {f === 'groups' && <GroupsRanking tournament={tournament} />}
      {f === 'knockout' && <KnockoutRanking tournament={tournament} />}
      {f === 'groups-ko' && <GroupsKoRanking tournament={tournament} />}
    </div>
  )
}

type RotationRow = RotationRanking

function RotationRankingView({ tournament }: Props) {
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

  return (
    <div className="space-y-6">
      <p className="text-xs text-fg-muted">
        {t('ranking.matchesProgress', { done: completed, total })}
        {completed < total && t('ranking.liveSuffix')}
      </p>
      <RankingSection
        title={showPerGender ? t('ranking.overall') : undefined}
        rows={rows}
      />
      {showPerGender && womenRows.length > 0 && (
        <RankingSection title={t('ranking.women')} rows={womenRows} />
      )}
      {showPerGender && menRows.length > 0 && (
        <RankingSection title={t('ranking.men')} rows={menRows} />
      )}
    </div>
  )
}

function RankingSection({
  title,
  rows,
}: {
  title?: string
  rows: RotationRow[]
}) {
  const podium = rows.slice(0, 3)
  return (
    <section className="space-y-4">
      {title && (
        <h2 className="serif text-xl font-semibold border-b border-border pb-1.5">
          {title}
        </h2>
      )}
      {podium.length >= 3 && (
        <Podium entries={podium.map(rowToPodiumEntry)} size="compact" />
      )}
      <RankingTable rows={rows.map(rowToTableRow)} />
    </section>
  )
}

function rowToPodiumEntry(r: RotationRow): PodiumEntry {
  return {
    name: r.name,
    subtitle: `${r.wins} S · ${r.diff > 0 ? '+' : ''}${r.diff}`,
  }
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
          <Card key={gi} variant="base" className="p-4">
            <h3 className="serif font-semibold mb-3">
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
          </Card>
        )
      })}
    </div>
  )
}

function KnockoutRanking({ tournament }: Props) {
  const { t } = useTranslation()
  const entryName = useCallback(
    (id: string) =>
      tournament.entries.find((e) => e.id === id)?.name ?? '?',
    [tournament.entries],
  )
  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName, undefined, t),
    [tournament.bracket, entryName, t],
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
      resolveBracket(
        tournament.bracket,
        entryName,
        (g, r) => groupWinnerMap.get(`${g}|${r}`),
        t,
      ),
    [tournament.bracket, entryName, groupWinnerMap, t],
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
              <Card key={gi} variant="base" className="p-4">
                <h3 className="serif font-semibold mb-2">
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
              </Card>
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
        <Card variant="hero" className="bg-court-pattern text-cream text-center p-6">
          <div className="text-5xl mb-2 animate-gold-glow inline-block rounded-full px-4 py-2">🏆</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-cream/80">
            {t('ranking.champion')}
          </div>
          <div className="serif text-3xl sm:text-4xl font-semibold mt-1">
            {champion}
          </div>
        </Card>
      ) : (
        <div className="rounded-card border border-dashed border-border-strong bg-surface-muted px-4 py-3 text-center text-sm text-fg-muted">
          {t('ranking.finalPending')}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Card variant="base" className="p-3">
          <div className="text-xs uppercase tracking-wider text-fg-muted mb-1">
            {t('ranking.finalist')}
          </div>
          <div className="serif font-semibold text-base">
            {runnerUp ?? t('common.dash')}
          </div>
        </Card>
        <Card variant="base" className="p-3">
          <div className="text-xs uppercase tracking-wider text-fg-muted mb-1">
            {t('ranking.semiLosers')}
          </div>
          <div className="serif font-semibold text-base">
            {thirds.length > 0 ? thirds.join(', ') : t('common.dash')}
          </div>
        </Card>
      </div>
    </div>
  )
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

function medal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

function RankingTable({ rows }: { rows: TableRow[] }) {
  const { t } = useTranslation()
  return (
    <Card variant="base" className="overflow-x-auto p-0">
      <table className="w-full text-sm 2xl:text-lg">
        <thead>
          <tr className="bg-surface-sunken text-fg-muted text-left text-xs uppercase tracking-wider">
            <th className="px-3 py-2 font-semibold w-12">#</th>
            <th className="px-3 py-2 font-semibold">{t('ranking.col.name')}</th>
            <th className="px-2 py-2 font-semibold text-right" title={t('ranking.col.played')}>
              <abbr title={t('ranking.col.played')} className="no-underline">
                {t('ranking.col.playedShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 font-semibold text-right" title={t('ranking.col.wins')}>
              <abbr title={t('ranking.col.wins')} className="no-underline">
                {t('ranking.col.winsShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 font-semibold text-right" title={t('ranking.col.draws')}>
              <abbr title={t('ranking.col.draws')} className="no-underline">
                {t('ranking.col.drawsShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 font-semibold text-right" title={t('ranking.col.losses')}>
              <abbr title={t('ranking.col.losses')} className="no-underline">
                {t('ranking.col.lossesShort')}
              </abbr>
            </th>
            <th className="px-2 py-2 font-semibold text-right" title={t('ranking.col.gamesTitle')}>
              {t('ranking.col.games')}
            </th>
            <th className="px-3 py-2 font-semibold text-right" title={t('ranking.col.diffTitle')}>
              {t('ranking.col.diff')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={[
                'border-t border-border transition-colors hover:bg-surface-muted',
                r.rank === 1 ? 'bg-gold-soft/30' : '',
              ].join(' ')}
            >
              <td className="px-3 py-2 2xl:py-3 tabular">
                <span className="inline-flex items-center gap-1 font-semibold">
                  {r.rank <= 3 && <span aria-hidden>{medal(r.rank)}</span>}
                  {r.rank}.
                </span>
              </td>
              <td className="px-3 py-2 2xl:py-3 flex items-center gap-2">
                <Avatar name={r.name} size="xs" />
                <span className="truncate">{r.name}</span>
              </td>
              <td className="px-2 py-2 2xl:py-3 text-right tabular">{r.played}</td>
              <td className="px-2 py-2 2xl:py-3 text-right tabular text-brand font-semibold">
                {r.wins}
              </td>
              <td className="px-2 py-2 2xl:py-3 text-right tabular text-fg-muted">
                {r.draws}
              </td>
              <td className="px-2 py-2 2xl:py-3 text-right tabular text-danger-fg">
                {r.losses}
              </td>
              <td className="px-2 py-2 2xl:py-3 text-right tabular">
                {r.for}:{r.against}
              </td>
              <td className="px-3 py-2 2xl:py-3 text-right tabular font-medium">
                {r.diff > 0 ? '+' : ''}
                {r.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
