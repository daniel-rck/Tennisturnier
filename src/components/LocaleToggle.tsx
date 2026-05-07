import { useTranslation } from '../i18n'
import type { Locale } from '../hooks/useLocale'

const NEXT: Record<Locale, Locale> = { de: 'en', en: 'de' }

export function LocaleToggle({ className = '' }: { className?: string }) {
  const { t, locale, setLocale } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => setLocale(NEXT[locale])}
      title={t('locale.title')}
      aria-label={t('locale.label', { current: t(locale === 'de' ? 'locale.de' : 'locale.en') })}
      className={
        'inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-emerald-100 hover:text-white hover:bg-emerald-600 leading-none text-sm font-semibold ' +
        className
      }
    >
      <span aria-hidden>{locale.toUpperCase()}</span>
    </button>
  )
}
