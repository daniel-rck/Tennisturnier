import { useEffect } from "react";

interface Props {
  /** Increment to retrigger. */
  trigger: number;
  /** 'burst' = single shot, 'shower' = sustained 5s rain for the gold reveal. */
  intensity?: "burst" | "shower";
}

/**
 * Fire confetti when `trigger` increments. Mounting this component does NOT
 * fire — only changes do, so a hydrated reveal state on viewer reload stays quiet.
 */
export function ConfettiBurst({ trigger, intensity = "burst" }: Props) {
  useEffect(() => {
    if (trigger === 0) return;
    // Respect users' motion preferences — skip confetti entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let cancelled = false;
    let raf = 0;
    // Lazy-load canvas-confetti so it stays out of the initial bundle — it is
    // only ever needed during the award-ceremony reveal.
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      if (intensity === "burst") {
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
          startVelocity: 45,
        });
        return;
      }
      // Shower: bursts from both lower corners, repeated for ~5s.
      const end = Date.now() + 5000;
      const tick = () => {
        if (cancelled) return;
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.85 },
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.85 },
        });
        if (Date.now() < end) raf = requestAnimationFrame(tick);
      };
      tick();
    });
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trigger, intensity]);

  return null;
}
