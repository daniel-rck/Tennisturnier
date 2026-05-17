import type { ReactNode } from 'react'

interface Option<T extends string> {
  value: T
  label: ReactNode
  description?: string
}

interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  ariaLabel?: string
  size?: 'sm' | 'md'
  /** Grid (default) is N equal columns; Row is auto-flex with horizontal scroll. */
  layout?: 'grid' | 'row'
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  layout = 'grid',
}: Props<T>) {
  const layoutCls =
    layout === 'grid'
      ? `grid gap-2 ${gridCols(options.length)}`
      : 'flex gap-2 overflow-x-auto -mx-1 px-1'
  const padCls =
    size === 'sm' ? 'px-3 py-1.5 text-sm min-h-[36px]' : 'px-3 py-2 text-sm min-h-[44px]'
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={layoutCls}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={[
              'rounded-md border transition-colors whitespace-nowrap text-center font-medium',
              padCls,
              active
                ? 'border-brand bg-brand-soft text-brand-soft-fg'
                : 'border-border-strong bg-surface text-fg-muted hover:border-brand-hover hover:text-fg',
            ].join(' ')}
          >
            <div>{opt.label}</div>
            {opt.description && (
              <div className="text-[10px] font-normal text-fg-subtle mt-0.5 normal-case tracking-normal">
                {opt.description}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function gridCols(n: number): string {
  if (n <= 2) return 'grid-cols-2'
  if (n === 3) return 'grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-4'
}
