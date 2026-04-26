import { useEffect, useState } from 'react'
import { useTournament } from './hooks/useTournament'
import { generateSchedule } from './scheduler'
import { SetupPanel } from './components/SetupPanel'
import { PlayersPanel } from './components/PlayersPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { RankingPanel } from './components/RankingPanel'
import { PrintView } from './components/PrintView'
import { EntriesPanel } from './components/EntriesPanel'
import { GroupsPanel } from './components/GroupsPanel'
import { BracketPanel } from './components/BracketPanel'

type Tab =
  | 'setup'
  | 'players'
  | 'entries'
  | 'schedule'
  | 'groups'
  | 'bracket'
  | 'ranking'
  | 'print'

function App() {
  const t = useTournament()
  const [tab, setTab] = useState<Tab>('setup')
  const [warnings, setWarnings] = useState<string[]>([])

  const handleGenerate = () => {
    const result = generateSchedule(t.tournament)
    t.setSchedule(result.rounds)
    setWarnings(result.warnings)
  }

  const tabs: { id: Tab; label: string }[] = (() => {
    const f = t.tournament.format
    const list: { id: Tab; label: string }[] = [
      { id: 'setup', label: 'Einstellungen' },
    ]
    if (f === 'rotation') {
      list.push({ id: 'players', label: 'Spieler:innen' })
      list.push({ id: 'schedule', label: 'Spielplan' })
    } else {
      list.push({ id: 'entries', label: 'Teams' })
      if (f === 'groups' || f === 'groups-ko')
        list.push({ id: 'groups', label: 'Gruppen' })
      if (f === 'knockout' || f === 'groups-ko')
        list.push({ id: 'bracket', label: 'Bracket' })
    }
    list.push({ id: 'ranking', label: 'Siegerehrung' })
    list.push({ id: 'print', label: 'Drucken' })
    return list
  })()

  // If selected tab disappeared after format change, fall back to setup
  useEffect(() => {
    if (!tabs.some((tt) => tt.id === tab)) setTab('setup')
  }, [tabs, tab])

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
          {tabs.map((tt) => (
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
              format={t.tournament.format}
              entryFormat={t.tournament.entryFormat}
              courts={t.tournament.courts}
              rounds={t.tournament.rounds}
              mode={t.tournament.mode}
              groupCount={t.tournament.groupCount}
              advancePerGroup={t.tournament.advancePerGroup}
              onName={t.setName}
              onFormat={t.setFormat}
              onEntryFormat={t.setEntryFormat}
              onCourts={t.setCourts}
              onRounds={t.setRounds}
              onMode={t.setMode}
              onGroupCount={t.setGroupCount}
              onAdvancePerGroup={t.setAdvancePerGroup}
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
          {tab === 'entries' && (
            <EntriesPanel
              entries={t.tournament.entries}
              entryFormat={t.tournament.entryFormat}
              onAdd={t.addEntry}
              onUpdate={t.updateEntry}
              onRemove={t.removeEntry}
              onReorder={t.setEntriesOrder}
              onSortByName={t.sortEntriesByName}
            />
          )}
          {tab === 'schedule' && (
            <SchedulePanel
              tournament={t.tournament}
              onGenerate={handleGenerate}
              onTimerMinutes={t.setTimerMinutes}
              onScore={t.setMatchScore}
              warnings={warnings}
            />
          )}
          {tab === 'groups' && (
            <GroupsPanel
              tournament={t.tournament}
              onSetGroupSchedule={t.setGroupSchedule}
              onScore={t.setGroupScore}
              onSetGroupCount={t.setGroupCount}
            />
          )}
          {tab === 'bracket' && (
            <BracketPanel
              tournament={t.tournament}
              onSetBracket={t.setBracket}
              onScore={t.setBracketScore}
            />
          )}
          {tab === 'ranking' && <RankingPanel tournament={t.tournament} />}
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
