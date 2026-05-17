import { useTranslation } from '../i18n'
import type { Locale } from '../hooks/useLocale'

const NEXT: Record<Locale, Locale> = { de: 'en', en: 'de' }

interface Props {
  className?: string
  appearance?: 'header' | 'default'
}

export function LocaleToggle({ className = '', appearance = 'default' }: Props) {
  const { t, locale, setLocale } = useTranslation()
  const base =
    appearance === 'header'
      ? 'text-cream/85 hover:text-cream hover:bg-white/10'
      : 'text-fg-muted hover:text-fg hover:bg-surface-sunken'
  return (
    <button
      type="button"
      onClick={() => setLocale(NEXT[locale])}
      title={t('locale.title')}
      aria-label={t('locale.label', { current: t(locale === 'de' ? 'locale.de' : 'locale.en') })}
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md leading-none text-sm font-semibold transition-colors ${base} ${className}`}
    >
      <span aria-hidden>{locale.toUpperCase()}</span>
    </button>
  )
}
