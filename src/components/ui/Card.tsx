import type { HTMLAttributes, ReactNode } from 'react'

type Variant = 'base' | 'elevated' | 'hero' | 'flat'

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  flat: 'rounded-card bg-surface border border-border',
  base: 'rounded-card bg-surface border border-border shadow-card',
  elevated: 'rounded-card bg-surface border border-border shadow-elevated',
  hero: 'rounded-card bg-surface border border-border shadow-court',
}

export function Card({ variant = 'base', className = '', children, ...rest }: Props) {
  return (
    <div className={`${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`px-4 py-3 border-b border-border ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardBody({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`px-4 py-4 ${className}`} {...rest}>
      {children}
    </div>
  )
}
