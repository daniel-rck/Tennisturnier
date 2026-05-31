import { type Theme, useTheme } from "../hooks/useTheme";
import { type TranslationKey, useTranslation } from "../i18n";

const ICONS: Record<Theme, string> = {
  light: "☀",
  dark: "☾",
  system: "🖥",
};
const LABEL_KEYS: Record<Theme, TranslationKey> = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system",
};
const NEXT: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

interface Props {
  className?: string;
  /** "header" = cream-on-court header styling, "default" = neutral surface styling */
  appearance?: "header" | "default";
}

export function ThemeToggle({ className = "", appearance = "default" }: Props) {
  const { theme, cycle } = useTheme();
  const { t } = useTranslation();
  const current = t(LABEL_KEYS[theme]);
  const next = t(LABEL_KEYS[NEXT[theme]]);
  const base =
    appearance === "header"
      ? "text-cream/85 hover:text-cream hover:bg-white/10"
      : "text-fg-muted hover:text-fg hover:bg-surface-sunken";
  return (
    <button
      type="button"
      onClick={cycle}
      title={t("theme.title", { current, next })}
      aria-label={t("theme.label", { current })}
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md leading-none transition-colors ${base} ${className}`}
    >
      <span aria-hidden className="text-lg">
        {ICONS[theme]}
      </span>
    </button>
  );
}
