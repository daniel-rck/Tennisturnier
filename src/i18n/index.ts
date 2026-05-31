import { type Locale, useLocale } from "../hooks/useLocale";
import { de, type TranslationKey } from "./de";
import { en } from "./en";

const TABLES: Record<Locale, Record<TranslationKey, string>> = { de, en };

export type { Locale, TranslationKey };

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k as keyof typeof vars]) : `{${k}}`,
  );
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const table = TABLES[locale];
  const tpl = table[key] ?? de[key] ?? key;
  return format(tpl, vars);
}

export function useTranslation(): {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (next: Locale) => void;
} {
  const { locale, setLocale } = useLocale();
  return {
    t: (key, vars) => translate(locale, key, vars),
    locale,
    setLocale,
  };
}
