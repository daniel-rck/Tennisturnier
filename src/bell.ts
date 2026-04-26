let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Cls =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Cls) return null
    ctx = new Cls()
  }
  return ctx
}

export async function ringBell(times = 3): Promise<void> {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      return
    }
  }

  const partials = [
    { freq: 880, amp: 1.0, decay: 1.4 },
    { freq: 1320, amp: 0.55, decay: 1.0 },
    { freq: 1760, amp: 0.3, decay: 0.7 },
    { freq: 2640, amp: 0.15, decay: 0.4 },
  ]

  for (let i = 0; i < times; i++) {
    const start = c.currentTime + i * 0.6
    for (const p of partials) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(p.freq, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(p.amp * 0.25, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + p.decay)
      osc.connect(gain).connect(c.destination)
      osc.start(start)
      osc.stop(start + p.decay + 0.05)
    }
  }
}

export function unlockAudio(): void {
  const c = getCtx()
  if (c?.state === 'suspended') c.resume().catch(() => {})
}
