import { useState } from 'react'
import { useTournament } from './hooks/useTournament'
import { generateSchedule } from './scheduler'
import { SetupPanel } from './components/SetupPanel'
import { PlayersPanel } from './components/PlayersPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { PrintView } from './components/PrintView'

type Tab = 'setup' | 'players' | 'schedule' | 'print'

const TABS: { id: Tab; label: string }[] = [
  { id: 'setup', label: 'Einstellungen' },
  { id: 'players', label: 'Spieler:innen' },
  { id: 'schedule', label: 'Spielplan' },
  { id: 'print', label: 'Drucken' },
]

function App() {
  const t = useTournament()
  const [tab, setTab] = useState<Tab>('setup')
  const [warnings, setWarnings] = useState<string[]>([])

  const handleGenerate = () => {
    const result = generateSchedule(t.tournament)
    t.setSchedule(result.rounds)
    setWarnings(result.warnings)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🎾
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              Tennisturnier-Planer
            </h1>
            <p className="text-xs text-emerald-100">
              {t.tournament.name || 'Vereinsturnier'}
            </p>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tt) => (
            <button
              key={tt.id}
              type="button"
              onClick={() => setTab(tt.id)}
              className={
                'px-3 py-2 text-sm whitespace-nowrap border-b-2 transition ' +
                (tab === tt.id
                  ? 'border-white font-semibold'
                  : 'border-transparent text-emerald-100 hover:text-white')
              }
            >
              {tt.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {tab === 'setup' && (
            <SetupPanel
              name={t.tournament.name}
              courts={t.tournament.courts}
              rounds={t.tournament.rounds}
              mode={t.tournament.mode}
              onName={t.setName}
              onCourts={t.setCourts}
              onRounds={t.setRounds}
              onMode={t.setMode}
              onReset={t.reset}
            />
          )}
          {tab === 'players' && (
            <PlayersPanel
              players={t.tournament.players}
              onAdd={t.addPlayer}
              onUpdate={t.updatePlayer}
              onRemove={t.removePlayer}
              onSort={t.sortPlayersBy}
              onArrayMove={t.setPlayersOrder}
            />
          )}
          {tab === 'schedule' && (
            <SchedulePanel
              tournament={t.tournament}
              onGenerate={handleGenerate}
              warnings={warnings}
            />
          )}
          {tab === 'print' && <PrintView tournament={t.tournament} />}
        </div>
      </main>

      <footer className="no-print text-center text-xs text-slate-500 py-4">
        Lokal im Browser gespeichert · keine Daten verlassen dein Gerät
      </footer>
    </div>
  )
}

export default App
