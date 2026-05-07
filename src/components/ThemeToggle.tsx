import { useTheme, type Theme } from '../hooks/useTheme'
import { useTranslation, type TranslationKey } from '../i18n'

const ICONS: Record<Theme, string> = {
  light: '☀',
  dark: '☾',
  system: '🖥',
}
const LABEL_KEYS: Record<Theme, TranslationKey> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
}
const NEXT: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, cycle } = useTheme()
  const { t } = useTranslation()
  const current = t(LABEL_KEYS[theme])
  const next = t(LABEL_KEYS[NEXT[theme]])
  return (
    <button
      type="button"
      onClick={cycle}
      title={t('theme.title', { current, next })}
      aria-label={t('theme.label', { current })}
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
