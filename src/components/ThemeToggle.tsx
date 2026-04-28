import { useTheme, type Theme } from '../hooks/useTheme'

const ICONS: Record<Theme, string> = {
  light: '☀',
  dark: '☾',
  system: '🖥',
}
const LABELS: Record<Theme, string> = {
  light: 'Hell',
  dark: 'Dunkel',
  system: 'System',
}
const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, cycle } = useTheme()
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${LABELS[theme]} → ${LABELS[NEXT[theme]]}`}
      aria-label={`Theme wechseln (aktuell: ${LABELS[theme]})`}
      className={
        'text-emerald-100 hover:text-white text-sm px-2 py-1 leading-none ' +
        className
      }
    >
      <span aria-hidden className="text-base">
        {ICONS[theme]}
      </span>
    </button>
  )
}
