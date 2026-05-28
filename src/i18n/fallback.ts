import { de, type TranslationKey } from './de'

/**
 * Minimal translator signature shared by pure modules (scheduler, brackets …)
 * that emit user-facing strings but must stay free of React/locale state.
 * The app passes its real `t`; tests and non-UI callers fall back to German.
 */
export type Translate = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string

/** Pure German fallback — mirrors `format()` from ./index without importing it
 *  (index pulls in React hooks). */
export const germanFallback: Translate = (key, vars) => {
  const tpl: string = de[key] ?? key
  if (!vars) return tpl
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  )
}
