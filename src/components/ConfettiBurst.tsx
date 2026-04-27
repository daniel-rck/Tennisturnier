import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  /** Increment to retrigger. */
  trigger: number
  /** 'burst' = single shot, 'shower' = sustained 5s rain for the gold reveal. */
  intensity?: 'burst' | 'shower'
}

/**
 * Fire confetti when `trigger` increments. Mounting this component does NOT
 * fire — only changes do, so a hydrated reveal state on viewer reload stays quiet.
 */
export function ConfettiBurst({ trigger, intensity = 'burst' }: Props) {
  useEffect(() => {
    if (trigger === 0) return
    if (intensity === 'burst') {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        startVelocity: 45,
      })
      return
    }
    // Shower: bursts from both lower corners, repeated for ~5s.
    const end = Date.now() + 5000
    const tick = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.85 },
      })
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.85 },
      })
      if (Date.now() < end) requestAnimationFrame(tick)
    }
    tick()
  }, [trigger, intensity])

  return null
}
