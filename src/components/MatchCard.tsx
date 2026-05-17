import { useState } from 'react'
import { useTranslation } from '../i18n'
import { Pill } from './ui/Pill'
import { ScoreSheet } from './ScoreSheet'

interface Props {
  court?: number | string
  teamAName: string
  teamBName: string
  scoreA: number | undefined
  scoreB: number | undefined
  onChange: (a: number | undefined, b: number | undefined) => void
  /** Optional label shown above the team names (e.g. round number, group letter) */
  eyebrow?: string
  /** Disable score editing (viewer mode) */
  readOnly?: boolean
  /** Compact variant for grid listings */
  variant?: 'default' | 'compact'
}

type Status = 'pending' | 'partial' | 'complete'

export function MatchCard({
  court,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  onChange,
  eyebrow,
  readOnly = false,
  variant = 'default',
}: Props) {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)

  const hasA = scoreA != null
  const hasB = scoreB != null
  const status: Status = hasA && hasB ? 'complete' : hasA || hasB ? 'partial' : 'pending'

  const accentClass =
    status === 'complete'
      ? 'border-l-4 border-l-brand'
      : status === 'partial'
        ? 'border-l-4 border-l-clay'
        : 'border-l-4 border-l-transparent'

  const winner: 'A' | 'B' | null =
    status === 'complete' && scoreA! !== scoreB!
      ? scoreA! > scoreB!
        ? 'A'
        : 'B'
      : null

  const openSheet = () => {
    if (readOnly) return
    setSheetOpen(true)
  }

  return (
    <>
      <div
        className={[
          'rounded-card border border-border bg-surface shadow-card overflow-hidden',
          accentClass,
        ].join(' ')}
      >
        <div className="px-3.5 pt-2.5 pb-1.5 flex items-center justify-between gap-2">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle truncate">
            {eyebrow ??
              (court !== undefined ? t('schedule.court', { n: court }) : null)}
          </div>
          {status === 'complete' && <Pill tone="brand">{t('schedule.statusComplete')}</Pill>}
          {status === 'partial' && <Pill tone="warn">{t('schedule.statusPartial')}</Pill>}
        </div>
        <button
          type="button"
          onClick={openSheet}
          disabled={readOnly}
          className={[
            'w-full text-left px-3.5 pb-3 pt-1',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-surface-muted active:bg-surface-sunken',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset transition-colors',
          ].join(' ')}
          aria-label={
            readOnly
              ? `${teamAName} vs ${teamBName}`
              : t('scoreSheet.title', { teamA: teamAName, teamB: teamBName })
          }
        >
          <div
            className={[
              'grid items-center gap-3',
              variant === 'compact' ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto]',
            ].join(' ')}
          >
            <div className="min-w-0 space-y-1.5">
              <TeamRow name={teamAName} winner={winner === 'A'} />
              <TeamRow name={teamBName} winner={winner === 'B'} />
            </div>
            <div className="shrink-0 text-right">
              <ScoreDisplay score={scoreA} highlight={winner === 'A'} />
              <ScoreDisplay score={scoreB} highlight={winner === 'B'} />
            </div>
          </div>
        </button>
      </div>

      <ScoreSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        teamAName={teamAName}
        teamBName={teamBName}
        scoreA={scoreA}
        scoreB={scoreB}
        onChange={onChange}
      />
    </>
  )
}

function TeamRow({ name, winner }: { name: string; winner: boolean }) {
  return (
    <div
      className={[
        'truncate text-sm sm:text-base',
        winner ? 'font-semibold text-fg' : 'text-fg',
      ].join(' ')}
      title={name}
    >
      {winner && (
        <span className="text-brand mr-1" aria-hidden>
          ▸
        </span>
      )}
      {name}
    </div>
  )
}

function ScoreDisplay({
  score,
  highlight,
}: {
  score: number | undefined
  highlight: boolean
}) {
  const display = score ?? '–'
  return (
    <div
      className={[
        'serif text-2xl sm:text-3xl leading-tight tabular',
        score === undefined ? 'text-fg-subtle font-normal' : 'font-semibold',
        highlight ? 'text-brand' : score !== undefined ? 'text-fg' : '',
      ].join(' ')}
      key={String(score)}
    >
      {display}
    </div>
  )
}
