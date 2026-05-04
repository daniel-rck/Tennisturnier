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

/** Short noise burst used as the metallic strike attack of a bell. */
function strikeAttack(c: AudioContext, start: number, duration: number, amp: number) {
  const sampleRate = c.sampleRate
  const len = Math.max(1, Math.floor(sampleRate * duration))
  const buffer = c.createBuffer(1, len, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / len
    data[i] = (Math.random() * 2 - 1) * (1 - t)
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 2500
  const gain = c.createGain()
  gain.gain.setValueAtTime(amp, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

/** V1 – Boxing-Bell: harter Anschlag, inharmonische Obertöne, mittlerer Decay. */
export async function ringBellBoxing(times = 3): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  // Inharmonic partials based on a classic struck-bell spectrum.
  // Ratios are deliberately non-integer so it doesn't sound like a tonal pad.
  const partials = [
    { ratio: 1.0, amp: 1.0, decay: 1.2 },
    { ratio: 1.19, amp: 0.55, decay: 1.0 }, // minor third (typical bell tierce)
    { ratio: 2.4, amp: 0.4, decay: 0.7 },
    { ratio: 3.1, amp: 0.25, decay: 0.45 },
    { ratio: 4.55, amp: 0.15, decay: 0.3 },
  ]
  const fundamental = 620
  for (let i = 0; i < times; i++) {
    const start = c.currentTime + i * 0.55
    strikeAttack(c, start, 0.04, 0.35)
    for (const p of partials) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(fundamental * p.ratio, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(p.amp * 0.22, start + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + p.decay)
      osc.connect(gain).connect(c.destination)
      osc.start(start)
      osc.stop(start + p.decay + 0.05)
    }
  }
}

/** V2 – Wecker / mechanische Klingel: schnelles Trillern zwischen zwei Tönen. */
export async function ringBellAlarm(times = 3): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  // Each "ring" is a rapid alternation between two pitches, ~25 ms per chirp.
  const ringDuration = 0.45
  const chirp = 0.025
  const freqs = [780, 1040]
  for (let i = 0; i < times; i++) {
    const ringStart = c.currentTime + i * 0.6
    const chirps = Math.floor(ringDuration / chirp)
    for (let k = 0; k < chirps; k++) {
      const start = ringStart + k * chirp
      const f = freqs[k % 2]
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(f, start)
      // Envelope per chirp: quick attack, quick decay. Overall envelope tapers off.
      const envelope = 1 - k / chirps
      const peak = 0.12 * envelope
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peak, start + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + chirp)
      osc.connect(gain).connect(c.destination)
      osc.start(start)
      osc.stop(start + chirp + 0.005)
    }
  }
}

/** V3 – Tempelglocke: tiefer voller Bronzeklang mit langem Sustain. */
export async function ringBellTemple(times = 3): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  // Lower fundamental, strongly inharmonic, long decays for a meditative bronze tone.
  const partials = [
    { ratio: 0.5, amp: 0.4, decay: 4.5 }, // hum tone
    { ratio: 1.0, amp: 1.0, decay: 4.0 }, // prime
    { ratio: 1.2, amp: 0.7, decay: 3.0 }, // minor third
    { ratio: 1.51, amp: 0.45, decay: 2.2 }, // quint
    { ratio: 2.01, amp: 0.35, decay: 1.6 }, // nominal
    { ratio: 2.66, amp: 0.2, decay: 1.0 },
    { ratio: 4.1, amp: 0.1, decay: 0.6 },
  ]
  const fundamental = 380
  for (let i = 0; i < times; i++) {
    const start = c.currentTime + i * 1.1
    strikeAttack(c, start, 0.08, 0.18)
    for (const p of partials) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(fundamental * p.ratio, start)
      // Slow LFO for subtle shimmer (only on lower partials).
      if (p.ratio <= 2) {
        const lfo = c.createOscillator()
        const lfoGain = c.createGain()
        lfo.frequency.value = 4.5 + p.ratio
        lfoGain.gain.value = fundamental * p.ratio * 0.0015
        lfo.connect(lfoGain).connect(osc.frequency)
        lfo.start(start)
        lfo.stop(start + p.decay + 0.1)
      }
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(p.amp * 0.18, start + 0.02)
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
