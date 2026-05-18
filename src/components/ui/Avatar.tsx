import type { Gender } from '../../types'

interface Props {
  name: string
  gender?: Gender
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

const PALETTE: [string, string][] = [
  ['bg-[#d6ecd6]', 'text-[#1a3a2e]'],
  ['bg-[#fae8b8]', 'text-[#7c5a1a]'],
  ['bg-[#f7d4c0]', 'text-[#8b3a1a]'],
  ['bg-[#d9e6f5]', 'text-[#1d3a5c]'],
  ['bg-[#ead9f0]', 'text-[#4a2a5a]'],
  ['bg-[#e8e6c8]', 'text-[#4a4a1a]'],
]

function colorFor(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).slice(0, 2)
  return parts.map((p) => p.charAt(0).toUpperCase()).join('')
}

export function Avatar({ name, gender, size = 'md', className = '' }: Props) {
  const [bg, fg] = colorFor(name)
  return (
    <span
      aria-hidden
      className={`relative inline-flex items-center justify-center rounded-full font-semibold select-none ${SIZES[size]} ${bg} ${fg} ${className}`}
    >
      {initials(name)}
      {gender && size !== 'xs' && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full text-[8px] font-bold bg-surface border border-border ${
            gender === 'F' ? 'text-clay' : 'text-court'
          }`}
        >
          {gender === 'F' ? '♀' : '♂'}
        </span>
      )}
    </span>
  )
}
