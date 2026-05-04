import type { BellVariant } from './types'

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

export function unlockAudio(): void {
  const c = getCtx()
  if (c?.state === 'suspended') c.resume().catch(() => {})
}

// ---- Stoppable bookkeeping -------------------------------------------------
// Track every scheduled source so that stopBell() can silence the loop
// instantly, instead of letting the last queued ring finish (which would be
// up to ~4.5 s for the temple bell).

const activeNodes = new Set<AudioScheduledSourceNode>()

function track(node: AudioScheduledSourceNode): void {
  activeNodes.add(node)
  node.onended = () => activeNodes.delete(node)
}

let loopHandle: number | null = null

// ---- Building blocks -------------------------------------------------------

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
  track(osc)
}

/** Short noise burst used as the metallic strike attack of a struck bell. */
function strikeAttack(
  c: AudioContext,
  start: number,
  duration: number,
  amp: number,
): void {
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
  track(src)
}

function playPartials(
  c: AudioContext,
  start: number,
  fundamental: number,
  partials: { ratio: number; amp: number; decay: number }[],
  ampScale: number,
  shimmer = false,
): void {
  for (const p of partials) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(fundamental * p.ratio, start)
    if (shimmer && p.ratio <= 2) {
      const lfo = c.createOscillator()
      const lfoGain = c.createGain()
      lfo.frequency.value = 4.5 + p.ratio
      lfoGain.gain.value = fundamental * p.ratio * 0.0015
      lfo.connect(lfoGain).connect(osc.frequency)
      lfo.start(start)
      lfo.stop(start + p.decay + 0.1)
      track(lfo)
    }
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(p.amp * ampScale, start + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + p.decay)
    osc.connect(gain).connect(c.destination)
    osc.start(start)
    osc.stop(start + p.decay + 0.05)
    track(osc)
  }
}

// ---- Variants --------------------------------------------------------------

interface VariantSpec {
  /** Schedule one ring at `start` (relative to the AudioContext clock). */
  schedule: (c: AudioContext, start: number) => void
  /** Repeat interval (seconds) for the loop. */
  loopInterval: number
}

const CLASSIC_PARTIALS = [
  { ratio: 1.0, amp: 1.0, decay: 1.4 },
  { ratio: 1.5, amp: 0.55, decay: 1.0 },
  { ratio: 2.0, amp: 0.3, decay: 0.7 },
  { ratio: 3.0, amp: 0.15, decay: 0.4 },
]

const BOXING_PARTIALS = [
  { ratio: 1.0, amp: 1.0, decay: 1.2 },
  { ratio: 1.19, amp: 0.55, decay: 1.0 },
  { ratio: 2.4, amp: 0.4, decay: 0.7 },
  { ratio: 3.1, amp: 0.25, decay: 0.45 },
  { ratio: 4.55, amp: 0.15, decay: 0.3 },
]

const TEMPLE_PARTIALS = [
  { ratio: 0.5, amp: 0.4, decay: 4.5 },
  { ratio: 1.0, amp: 1.0, decay: 4.0 },
  { ratio: 1.2, amp: 0.7, decay: 3.0 },
  { ratio: 1.51, amp: 0.45, decay: 2.2 },
  { ratio: 2.01, amp: 0.35, decay: 1.6 },
  { ratio: 2.66, amp: 0.2, decay: 1.0 },
  { ratio: 4.1, amp: 0.1, decay: 0.6 },
]

const VARIANTS: Record<BellVariant, VariantSpec> = {
  classic: {
    loopInterval: 1.8,
    schedule: (c, start) =>
      playPartials(c, start, 880, CLASSIC_PARTIALS, 0.25),
  },
  boxing: {
    loopInterval: 1.6,
    schedule: (c, start) => {
      strikeAttack(c, start, 0.04, 0.35)
      playPartials(c, start, 620, BOXING_PARTIALS, 0.22)
    },
  },
  alarm: {
    loopInterval: 1.0,
    schedule: (c, start) => {
      const ringDuration = 0.45
      const chirp = 0.025
      const freqs = [780, 1040]
      const chirps = Math.floor(ringDuration / chirp)
      for (let k = 0; k < chirps; k++) {
        const t = start + k * chirp
        const f = freqs[k % 2]
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(f, t)
        const peak = 0.12 * (1 - k / chirps)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(peak, t + 0.003)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + chirp)
        osc.connect(gain).connect(c.destination)
        osc.start(t)
        osc.stop(t + chirp + 0.005)
        track(osc)
      }
    },
  },
  temple: {
    loopInterval: 4.5,
    schedule: (c, start) => {
      strikeAttack(c, start, 0.08, 0.18)
      playPartials(c, start, 380, TEMPLE_PARTIALS, 0.18, true)
    },
  },
}

// ---- Public API ------------------------------------------------------------

/** Play the variant once, used by the per-variant test buttons. */
export async function ringBellOnce(variant: BellVariant): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  VARIANTS[variant].schedule(c, c.currentTime)
}

/** Play the variant `times` times in succession, used by the legacy preview. */
export async function ringBell(
  variant: BellVariant = 'classic',
  times = 3,
): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  const spec = VARIANTS[variant]
  for (let i = 0; i < times; i++) {
    spec.schedule(c, c.currentTime + i * spec.loopInterval)
  }
}

/** Start ringing the chosen variant on a loop until {@link stopBell} is called. */
export function startBellLoop(variant: BellVariant): void {
  stopBell()
  void ensureRunning().then((c) => {
    if (!c) return
    const spec = VARIANTS[variant]
    spec.schedule(c, c.currentTime)
    loopHandle = window.setInterval(() => {
      const ctx2 = getCtx()
      if (!ctx2) return
      spec.schedule(ctx2, ctx2.currentTime)
    }, spec.loopInterval * 1000)
  })
}

/** Stop the loop and silence any currently sounding partials. */
export function stopBell(): void {
  if (loopHandle != null) {
    window.clearInterval(loopHandle)
    loopHandle = null
  }
  for (const n of activeNodes) {
    try {
      n.stop()
    } catch {
      // already stopped — ignore
    }
  }
  activeNodes.clear()
}

// ---- Reveal-only fanfares (unchanged behaviour) ----------------------------

/** Short ascending fanfare for revealing podium positions (3rd, 2nd). */
export async function playFanfare(): Promise<void> {
  const c = await ensureRunning()
  if (!c) return
  const t0 = c.currentTime
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
