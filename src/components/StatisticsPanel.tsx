import { useMemo } from 'react'
import type { Tournament } from '../types'
import { computePlayerStats, type PlayerStat } from '../statistics'
import { useTranslation } from '../i18n'
import { EmptyState } from './EmptyState'

interface Props {
  tournament: Tournament
}

export function StatisticsPanel({ tournament }: Props) {
  const { t } = useTranslation()
  const rows = useMemo(() => computePlayerStats(tournament), [tournament])

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title={t('statistics.empty.title')}
        description={t('statistics.empty.description')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted">{t('statistics.intro')}</p>

      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-sm 2xl:text-base">
          <thead>
            <tr className="bg-surface-sunken text-fg text-left">
              <th className="px-2 py-2">{t('statistics.col.player')}</th>
              <th className="px-2 py-2 text-right">{t('statistics.col.played')}</th>
              <th className="px-2 py-2 text-right">{t('statistics.col.wnl')}</th>
              <th className="px-2 py-2 text-right">{t('statistics.col.winRate')}</th>
              <th className="px-2 py-2 text-right tabular-nums">
                {t('statistics.col.gamesFor')}/{t('statistics.col.gamesAgainst')}
              </th>
              <th className="px-2 py-2 text-right">{t('statistics.col.diff')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerId} className="border-t border-border">
                <td className="px-2 py-1.5 font-medium">{r.name}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.played}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  <span className="text-brand">{r.wins}</span>
                  <span className="text-fg-subtle">/</span>
                  <span className="text-fg-muted">{r.draws}</span>
                  <span className="text-fg-subtle">/</span>
                  <span className="text-danger-fg">{r.losses}</span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {Math.round(r.winRate * 100)}%
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {r.gamesFor}:{r.gamesAgainst}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                  {r.diff > 0 ? '+' : ''}
                  {r.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <PartnerCard key={r.playerId} row={r} />
        ))}
      </div>

      <details className="text-xs text-fg-muted rounded-md border border-border bg-surface">
        <summary className="cursor-pointer list-none px-3 py-2 hover:text-fg">
          <span aria-hidden className="inline-block transition-transform mr-2">
            ▸
          </span>
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

function PartnerCard({ row }: { row: PlayerStat }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-md border border-border bg-surface p-3 text-sm">
      <p className="font-semibold mb-2">{row.name}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-fg-muted">{t('statistics.col.bestPartner')}</dt>
        <dd className="text-fg">
          {row.bestPartner
            ? t('statistics.partnerSummary', {
                name: row.bestPartner.name,
                wins: row.bestPartner.wins,
                played: row.bestPartner.played,
              })
            : t('statistics.noPartner')}
        </dd>
        <dt className="text-fg-muted">{t('statistics.col.bestOpponent')}</dt>
        <dd className="text-fg">
          {row.bestOpponent
            ? t('statistics.opponentSummary', {
                name: row.bestOpponent.name,
                wins: row.bestOpponent.wins,
                played: row.bestOpponent.played,
              })
            : t('statistics.noPartner')}
        </dd>
      </dl>
    </div>
  )
}
