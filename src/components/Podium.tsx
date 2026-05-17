import type { ReactNode } from 'react'

export interface PodiumEntry {
  rank: 1 | 2 | 3
  name: string
  subtitle?: string
  hidden?: boolean
}

interface Props {
  entries: PodiumEntry[]
  /** Bigger for reveal stage */
  size?: 'compact' | 'stage'
}

const ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
} as const

const TONES = {
  1: 'bg-gold-soft border-gold',
  2: 'bg-surface-sunken border-silver',
  3: 'bg-clay-soft border-bronze',
} as const

const HEIGHTS_COMPACT = {
  1: 'h-24',
  2: 'h-18',
  3: 'h-14',
} as const

const HEIGHTS_STAGE = {
  1: 'h-48',
  2: 'h-36',
  3: 'h-28',
} as const

/** Render order = visual order on screen (silver, gold, bronze) */
const VISUAL_ORDER: PodiumEntry['rank'][] = [2, 1, 3]

export function Podium({ entries, size = 'compact' }: Props) {
  const byRank = new Map(entries.map((e) => [e.rank, e]))
  const heights = size === 'stage' ? HEIGHTS_STAGE : HEIGHTS_COMPACT
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      {VISUAL_ORDER.map((rank) => {
        const e = byRank.get(rank)
        return (
          <PodiumColumn
            key={rank}
            rank={rank}
            entry={e}
            heightClass={heights[rank]}
            size={size}
          />
        )
      })}
    </div>
  )
}

function PodiumColumn({
  rank,
  entry,
  heightClass,
  size,
}: {
  rank: PodiumEntry['rank']
  entry: PodiumEntry | undefined
  heightClass: string
  size: 'compact' | 'stage'
}) {
  const showHidden = !entry || entry.hidden === true
  const isGold = rank === 1

  const nameClass =
    size === 'stage'
      ? 'serif text-2xl sm:text-4xl font-semibold'
      : 'serif text-lg sm:text-xl font-semibold'

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={[
          'text-3xl sm:text-5xl',
          showHidden ? 'opacity-30 grayscale' : '',
          isGold && !showHidden && size === 'stage' ? 'animate-gold-glow rounded-full' : '',
        ].join(' ')}
        aria-hidden
      >
        {ICONS[rank]}
      </div>
      <Field hidden={showHidden}>
        <div className={nameClass}>{entry?.name ?? '—'}</div>
        {entry?.subtitle && !showHidden && (
          <div className="text-xs sm:text-sm text-fg-muted tabular mt-0.5">
            {entry.subtitle}
          </div>
        )}
      </Field>
      <div
        className={[
          'w-full rounded-t-card border-t-4 flex items-center justify-center serif font-bold',
          TONES[rank],
          heightClass,
          size === 'stage' ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl',
        ].join(' ')}
      >
        {rank}
      </div>
    </div>
  )
}

function Field({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  if (hidden) {
    return (
      <div className="space-y-1">
        <div className="h-6 w-16 sm:w-24 rounded bg-surface-sunken mx-auto" />
      </div>
    )
  }
  return <div className="space-y-0.5 min-w-0">{children}</div>
}
