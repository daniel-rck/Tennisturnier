import { useCallback, useEffect } from "react";
import { type Theme, useTheme as useBaseTheme } from "../lib/ui/useTheme.ts";

export type { Theme };

/** accent-600 at hue 175 — the manifest's `theme_color` and index.html's meta. */
const THEME_COLOR_LIGHT = "#007e5a";
/** A near-black court green, so the browser chrome doesn't glare in dark mode. */
const THEME_COLOR_DARK = "#051410";

/**
 * The web-base theme hook plus two things this app needs on top:
 * a `cycle()` helper for the single-button toggle, and a `theme-color`
 * meta sync so the mobile browser chrome matches the court palette.
 *
 * Persistence, the `data-theme` contract and the cross-tab store deliberately
 * stay in the base hook (one store for the page since web-base 0.6.0)
 * — this used to be a full reimplementation with its own `tennisturnier:theme`
 * storage key, which meant the fleet had three different ways to remember a
 * theme choice.
 */
export function useTheme(): {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (next: Theme) => void;
  cycle: () => void;
} {
  const { theme, resolvedTheme, setTheme } = useBaseTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      // Leave media-qualified metas alone; they encode their own scheme.
      if (!m.getAttribute("media")) m.setAttribute("content", color);
    }
  }, [resolvedTheme]);

  const cycle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  return { theme, resolvedTheme, setTheme, cycle };
}
