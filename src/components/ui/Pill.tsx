import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type Tone = 'neutral' | 'brand' | 'warn' | 'danger' | 'gold' | 'live'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  children: ReactNode
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-fg-muted',
  brand: 'bg-brand-soft text-brand-soft-fg',
  warn: 'bg-warn-bg text-warn-fg',
  danger: 'bg-danger-bg text-danger-fg',
  gold: 'bg-gold-soft text-gold border border-gold/30',
  live: 'bg-danger-fg text-white animate-live-pulse',
}

export function Pill({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}

interface TogglePillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children: ReactNode
}

export function TogglePill({
  active = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: TogglePillProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors min-h-[36px]',
        active
          ? 'bg-brand text-white'
          : 'bg-surface-sunken text-fg-muted hover:bg-surface-muted hover:text-fg',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
