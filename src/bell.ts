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

async function ensureRunning(): Promise<AudioContext | null> {
  const c = getCtx()
  if (!c) return null
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      return null
    }
  }
  return c
}

interface ToneOpts {
  freq: number
  start: number
  duration: number
  amp?: number
  type?: OscillatorType
}

function playTone(c: AudioContext, opts: ToneOpts): void {
  const { freq, start, duration, amp = 0.2, type = 'sine' } = opts
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(amp, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Short ascending fanfare for revealing podium positions (3rd, 2nd). */
export async function playFanfare(): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  const t0 = c.currentTime
  // C5, E5, G5 arpeggio with slight overlap, sawtooth for brassy color
  const notes = [
    { freq: 523.25, t: 0.0, dur: 0.35 },
    { freq: 659.25, t: 0.12, dur: 0.4 },
    { freq: 783.99, t: 0.24, dur: 0.6 },
  ]
  for (const n of notes) {
    playTone(c, {
      freq: n.freq,
      start: t0 + n.t,
      duration: n.dur,
      amp: 0.18,
      type: 'sawtooth',
    })
    // Add an octave for richness
    playTone(c, {
      freq: n.freq * 2,
      start: t0 + n.t,
      duration: n.dur * 0.7,
      amp: 0.06,
      type: 'sawtooth',
    })
  }
}

/** Triumphant finale for the gold-medal reveal — longer, fuller chord. */
export async function playFinale(): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  const t0 = c.currentTime
  // Build-up arpeggio then sustained C major chord
  const buildUp = [
    { freq: 523.25, t: 0.0 },
    { freq: 659.25, t: 0.1 },
    { freq: 783.99, t: 0.2 },
    { freq: 1046.5, t: 0.3 },
  ]
  for (const n of buildUp) {
    playTone(c, {
      freq: n.freq,
      start: t0 + n.t,
      duration: 0.35,
      amp: 0.16,
      type: 'sawtooth',
    })
  }
  // Sustained finale chord
  const chord = [523.25, 659.25, 783.99, 1046.5]
  for (const f of chord) {
    playTone(c, {
      freq: f,
      start: t0 + 0.5,
      duration: 1.6,
      amp: 0.14,
      type: 'sawtooth',
    })
    playTone(c, {
      freq: f * 2,
      start: t0 + 0.5,
      duration: 1.4,
      amp: 0.05,
      type: 'sawtooth',
    })
  }
}
