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
        'inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-emerald-100 hover:text-white hover:bg-emerald-600 leading-none ' +
        className
      }
    >
      <span aria-hidden className="text-lg">
        {ICONS[theme]}
      </span>
    </button>
  )
}
