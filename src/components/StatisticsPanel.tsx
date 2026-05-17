import { useMemo, useState } from 'react'
import type { Tournament } from '../types'
import { computePlayerStats, type PlayerStat } from '../statistics'
import { useTranslation } from '../i18n'
import { EmptyState } from './EmptyState'
import { Card } from './ui/Card'
import { Avatar } from './ui/Avatar'
import { StatBar } from './ui/StatBar'
import { TogglePill } from './ui/Pill'

interface Props {
  tournament: Tournament
}

type SortBy = 'wins' | 'winRate' | 'diff' | 'played'

export function StatisticsPanel({ tournament }: Props) {
  const { t } = useTranslation()
  const rows = useMemo(() => computePlayerStats(tournament), [tournament])
  const [sortBy, setSortBy] = useState<SortBy>('wins')

  const sorted = useMemo(() => {
    const next = rows.slice()
    next.sort((a, b) => {
      if (sortBy === 'wins') return b.wins - a.wins || b.diff - a.diff
      if (sortBy === 'winRate') return b.winRate - a.winRate || b.played - a.played
      if (sortBy === 'diff') return b.diff - a.diff
      return b.played - a.played
    })
    return next
  }, [rows, sortBy])

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title={t('statistics.empty.title')}
        description={t('statistics.empty.description')}
      />
    )
  }

  const maxWins = Math.max(1, ...rows.map((r) => r.wins))
  const maxPlayed = Math.max(1, ...rows.map((r) => r.played))
  const totalMatches = rows.reduce((acc, r) => acc + r.played, 0) / 2 // each match counted twice if doubles, but coarse OK
  const totalWins = rows.reduce((acc, r) => acc + r.wins, 0)

  return (
    <div className="space-y-4">
      {/* Header strip with global stats */}
      <Card variant="flat" className="p-3.5 flex items-center justify-around gap-4 text-center flex-wrap">
        <Stat label="Spieler:innen" value={rows.length} />
        <Divider />
        <Stat label="Matches" value={Math.round(totalMatches)} />
        <Divider />
        <Stat label="Siege gesamt" value={totalWins} />
      </Card>

      {/* Sort pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle mr-1">
          Sort
        </span>
        <TogglePill active={sortBy === 'wins'} onClick={() => setSortBy('wins')}>
          Siege
        </TogglePill>
        <TogglePill active={sortBy === 'winRate'} onClick={() => setSortBy('winRate')}>
          Quote
        </TogglePill>
        <TogglePill active={sortBy === 'diff'} onClick={() => setSortBy('diff')}>
          Differenz
        </TogglePill>
        <TogglePill active={sortBy === 'played'} onClick={() => setSortBy('played')}>
          Matches
        </TogglePill>
      </div>

      {/* Player stat cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((r) => (
          <PlayerStatCard
            key={r.playerId}
            row={r}
            maxWins={maxWins}
            maxPlayed={maxPlayed}
          />
        ))}
      </div>

      <details className="text-xs text-fg-muted rounded-card border border-border bg-surface">
        <summary className="cursor-pointer list-none px-3 py-2.5 hover:text-fg">
          <span aria-hidden className="inline-block transition-transform mr-2">▸</span>
          {t('statistics.legendTitle')}
        </summary>
        <ul className="px-4 pb-3 space-y-1 list-disc list-inside">
          <li>{t('statistics.legend.played')}</li>
          <li>{t('statistics.legend.wnl')}</li>
          <li>{t('statistics.legend.winRate')}</li>
          <li>{t('statistics.legend.bestPartner')}</li>
          <li>{t('statistics.legend.bestOpponent')}</li>
        </ul>
      </details>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="serif text-2xl font-semibold tabular leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle mt-1">{label}</div>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-8 bg-border" aria-hidden />
}

function PlayerStatCard({
  row,
  maxWins,
  maxPlayed,
}: {
  row: PlayerStat
  maxWins: number
  maxPlayed: number
}) {
  const { t } = useTranslation()
  return (
    <Card variant="base" className="p-3.5 space-y-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={row.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="serif font-semibold text-base truncate" title={row.name}>
            {row.name}
          </div>
          <div className="text-xs text-fg-muted tabular">
            {row.played} Matches · {Math.round(row.winRate * 100)}% Quote
          </div>
        </div>
        <div
          className={[
            'serif font-bold text-xl tabular shrink-0 px-2 py-0.5 rounded-md',
            row.diff > 0
              ? 'text-brand bg-brand-soft'
              : row.diff < 0
                ? 'text-danger-fg bg-danger-bg'
                : 'text-fg-muted bg-surface-sunken',
          ].join(' ')}
        >
          {row.diff > 0 ? '+' : ''}
          {row.diff}
        </div>
      </div>

      <div className="space-y-2">
        <StatBar label="Siege" value={row.wins} max={maxWins} tone="brand" />
        <StatBar label="Matches" value={row.played} max={maxPlayed} tone="silver" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">
            🤝 {t('statistics.col.bestPartner')}
          </div>
          <div className="text-fg truncate" title={row.bestPartner?.name ?? ''}>
            {row.bestPartner
              ? t('statistics.partnerSummary', {
                  name: row.bestPartner.name,
                  wins: row.bestPartner.wins,
                  played: row.bestPartner.played,
                })
              : t('statistics.noPartner')}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">
            ⚔️ {t('statistics.col.bestOpponent')}
          </div>
          <div className="text-fg truncate" title={row.bestOpponent?.name ?? ''}>
            {row.bestOpponent
              ? t('statistics.opponentSummary', {
                  name: row.bestOpponent.name,
                  wins: row.bestOpponent.wins,
                  played: row.bestOpponent.played,
                })
              : t('statistics.noPartner')}
          </div>
        </div>
      </div>
    </Card>
  )
}
