import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Match,
  Player,
  RevealCategory,
  RevealStep,
  Round,
  Tournament,
} from '../types'
import { ConfettiBurst } from './ConfettiBurst'
import { playFanfare, playFinale, unlockAudio } from '../bell'

interface Props {
  tournament: Tournament
  isOwner: boolean
  onStep: (category: RevealCategory, step: RevealStep) => void
  onReset: () => void
  onClose: () => void
}

interface PodiumEntry {
  name: string
  wins: number
  diff: number
}

export function RevealPanel({
  tournament,
  isOwner,
  onStep,
  onReset,
  onClose,
}: Props) {
  if (tournament.format !== 'rotation') {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Reveal-Modus ist aktuell nur für Wechselturniere verfügbar.
        <div className="mt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-amber-400 px-3 py-1 hover:bg-amber-100"
          >
            Reveal-Modus beenden
          </button>
        </div>
      </div>
    )
  }
  return (
    <RevealStage
      tournament={tournament}
      isOwner={isOwner}
      onStep={onStep}
      onReset={onReset}
      onClose={onClose}
    />
  )
}

function RevealStage({
  tournament,
  isOwner,
  onStep,
  onReset,
  onClose,
}: Props) {
  const showCategories =
    tournament.mode === 'mixed' && tournament.perGenderRanking
  const tabs: { id: RevealCategory; label: string }[] = showCategories
    ? [
        { id: 'overall', label: 'Gesamt' },
        { id: 'women', label: 'Damen' },
        { id: 'men', label: 'Herren' },
      ]
    : [{ id: 'overall', label: 'Gesamt' }]
  const [tab, setTab] = useState<RevealCategory>('overall')
  const step = tournament.reveal.steps[tab]

  const podium = useMemo(
    () => computePodium(tournament, tab),
    [tournament, tab],
  )

  // Animation triggers — increment counters on every step change so ConfettiBurst
  // re-fires. Sound plays only on owner devices for the click that triggered it
  // AND on viewers for the step they observe.
  const [burstTrigger, setBurstTrigger] = useState(0)
  const [showerTrigger, setShowerTrigger] = useState(0)
  const lastStepRef = useRef<Record<RevealCategory, RevealStep>>(
    tournament.reveal.steps,
  )

  useEffect(() => {
    const prev = lastStepRef.current[tab]
    const curr = tournament.reveal.steps[tab]
    if (curr !== prev) {
      const becameVisible = (place: 1 | 2 | 3) =>
        !isVisible(prev, place) && isVisible(curr, place)
      if (becameVisible(3) || becameVisible(2)) {
        setBurstTrigger((n) => n + 1)
        playFanfare().catch(() => {})
      }
      if (becameVisible(1)) {
        setShowerTrigger((n) => n + 1)
        playFinale().catch(() => {})
      }
      lastStepRef.current = { ...lastStepRef.current, [tab]: curr }
    }
  }, [tournament.reveal.steps, tab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">🎉 Siegerehrung</h2>
        {isOwner && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Reveal-Modus beenden
          </button>
        )}
      </div>

      {showCategories && (
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map((tt) => (
            <button
              key={tt.id}
              type="button"
              onClick={() => setTab(tt.id)}
              className={
                'px-3 py-1.5 text-sm border-b-2 -mb-px transition ' +
                (tab === tt.id
                  ? 'border-emerald-600 font-semibold text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800')
              }
            >
              {tt.label}
            </button>
          ))}
        </div>
      )}

      {podium.length < 3 ? (
        <p className="text-slate-500 text-sm italic">
          Noch nicht genug Spieler:innen mit Ergebnissen für ein Podium.
        </p>
      ) : (
        <PodiumStage podium={podium} step={step} />
      )}

      {isOwner && podium.length >= 3 && (
        <RevealController
          step={step}
          onStep={(s) => {
            unlockAudio() // first user gesture — needed to allow audio
            onStep(tab, s)
          }}
          onReset={onReset}
        />
      )}

      <ConfettiBurst trigger={burstTrigger} intensity="burst" />
      <ConfettiBurst trigger={showerTrigger} intensity="shower" />
    </div>
  )
}

function isVisible(step: RevealStep, place: 1 | 2 | 3): boolean {
  if (step === 0) return false
  if (place === 3) return true
  if (place === 2) return step <= 2
  return step === 1
}

function PodiumStage({
  podium,
  step,
}: {
  podium: PodiumEntry[]
  step: RevealStep
}) {
  return (
    <div className="grid grid-cols-3 gap-3 items-end mt-8">
      <PodiumColumn
        place={2}
        entry={podium[1]}
        visible={isVisible(step, 2)}
        height="h-32"
        tone="bg-slate-300"
        medal="🥈"
      />
      <PodiumColumn
        place={1}
        entry={podium[0]}
        visible={isVisible(step, 1)}
        height="h-44"
        tone="bg-amber-300"
        medal="🥇"
      />
      <PodiumColumn
        place={3}
        entry={podium[2]}
        visible={isVisible(step, 3)}
        height="h-24"
        tone="bg-orange-300"
        medal="🥉"
      />
    </div>
  )
}

function PodiumColumn({
  place,
  entry,
  visible,
  height,
  tone,
  medal,
}: {
  place: number
  entry: PodiumEntry
  visible: boolean
  height: string
  tone: string
  medal: string
}) {
  return (
    <div
      className={
        'flex flex-col items-center gap-2 transition-all duration-700 ease-out ' +
        (visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 pointer-events-none')
      }
    >
      <div className="text-4xl">{visible ? medal : ' '}</div>
      <div className="font-semibold text-center text-base min-h-[1.5rem]">
        {visible ? entry.name : ' '}
      </div>
      <div className="text-xs text-slate-600 min-h-[1rem]">
        {visible
          ? `${entry.wins} Siege · ${entry.diff > 0 ? '+' : ''}${entry.diff}`
          : ' '}
      </div>
      <div
        className={`w-full ${height} ${tone} rounded-t-md flex items-center justify-center font-bold text-2xl text-slate-800 shadow`}
      >
        {place}
      </div>
    </div>
  )
}

function RevealController({
  step,
  onStep,
  onReset,
}: {
  step: RevealStep
  onStep: (s: RevealStep) => void
  onReset: () => void
}) {
  const buttons: { label: string; target: RevealStep; enabled: boolean }[] = [
    { label: '🥉 Platz 3 enthüllen', target: 3, enabled: step === 0 },
    { label: '🥈 Platz 2 enthüllen', target: 2, enabled: step === 3 },
    { label: '🥇 Platz 1 enthüllen', target: 1, enabled: step === 2 },
  ]

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
      <p className="text-xs text-slate-500">
        Steuere den Reveal — die Anzeige aktualisiert sich auf allen verbundenen
        Geräten.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {buttons.map((b) => (
          <button
            key={b.target}
            type="button"
            disabled={!b.enabled}
            onClick={() => onStep(b.target)}
            className={
              'rounded-md px-3 py-2 text-sm font-medium transition ' +
              (b.enabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed')
            }
          >
            {b.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-slate-500 hover:text-slate-800 underline"
      >
        Show neu starten (alle Kategorien)
      </button>
    </div>
  )
}

// ===== Podium computation =================================================

function computePodium(
  t: Tournament,
  cat: RevealCategory,
): PodiumEntry[] {
  const stats = computeStats(t.schedule, t.players)
  const filtered = stats.filter((s) => {
    if (cat === 'overall') return true
    const player = t.players.find((p) => p.id === s.id)
    if (!player) return false
    return cat === 'women' ? player.gender === 'F' : player.gender === 'M'
  })
  return filtered
    .sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      if (a.diff !== b.diff) return b.diff - a.diff
      if (a.gamesFor !== b.gamesFor) return b.gamesFor - a.gamesFor
      return a.name.localeCompare(b.name, 'de')
    })
    .slice(0, 3)
    .map((s) => ({ name: s.name, wins: s.wins, diff: s.diff }))
}

interface Stats {
  id: string
  name: string
  wins: number
  diff: number
  gamesFor: number
}

function computeStats(schedule: Round[], players: Player[]): Stats[] {
  const map = new Map<
    string,
    { id: string; name: string; wins: number; gamesFor: number; gamesAgainst: number }
  >()
  for (const p of players)
    map.set(p.id, { id: p.id, name: p.name, wins: 0, gamesFor: 0, gamesAgainst: 0 })
  for (const round of schedule) {
    for (const m of round.matches) accumulate(map, m)
  }
  return Array.from(map.values())
    .filter((s) => s.gamesFor + s.gamesAgainst > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      wins: s.wins,
      diff: s.gamesFor - s.gamesAgainst,
      gamesFor: s.gamesFor,
    }))
}

function accumulate(
  map: Map<
    string,
    { id: string; name: string; wins: number; gamesFor: number; gamesAgainst: number }
  >,
  m: Match,
): void {
  if (m.scoreA == null || m.scoreB == null) return
  const aWin = m.scoreA > m.scoreB
  const bWin = m.scoreB > m.scoreA
  for (const id of m.teamA.players) {
    const s = map.get(id)
    if (!s) continue
    s.gamesFor += m.scoreA
    s.gamesAgainst += m.scoreB
    if (aWin) s.wins++
  }
  for (const id of m.teamB.players) {
    const s = map.get(id)
    if (!s) continue
    s.gamesFor += m.scoreB
    s.gamesAgainst += m.scoreA
    if (bWin) s.wins++
  }
}
