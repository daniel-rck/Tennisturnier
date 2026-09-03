import { useCallback, useEffect } from "react";
import { type Theme, useTheme as useBaseTheme } from "../lib/ui/useTheme.ts";

export type { Theme };

/**
 * The web-base theme hook plus two things this app needs on top:
 * a `cycle()` helper for the single-button toggle, and a `theme-color`
 * meta sync so the mobile browser chrome matches the court palette.
 *
 * Persistence and the `data-theme` contract deliberately stay in the base hook
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
    const color = resolvedTheme === "dark" ? "#051410" : "#0a1f17";
    for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      // Leave the media-qualified metas alone; they encode their own scheme.
      if (!m.getAttribute("media")) m.setAttribute("content", color);
    }
  }, [resolvedTheme]);

  const cycle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  return { theme, resolvedTheme, setTheme, cycle };
}
