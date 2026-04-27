import { useEffect, useMemo } from 'react'
import type { Entry, GroupMatch, Tournament } from '../types'
import {
  assignGroups,
  groupStandings,
  resolveGroupAssignment,
  roundRobin,
} from '../groupScheduler'
import { groupLetter } from '../knockoutScheduler'
import { parsePositiveInt, parseScore } from '../utils/parseScore'

interface Props {
  tournament: Tournament
  onSetGroupSchedule: (matches: GroupMatch[]) => void
  onScore: (
    group: number,
    matchIndex: number,
    a: number | undefined,
    b: number | undefined,
  ) => void
  onSetGroupCount: (n: number) => void
  onInitGroupAssignment: () => void
  onReshuffle: () => void
}

export function GroupsPanel({
  tournament,
  onSetGroupSchedule,
  onScore,
  onSetGroupCount,
  onInitGroupAssignment,
  onReshuffle,
}: Props) {
  // Initialize group assignment lazily on first visit when there are entries.
  useEffect(() => {
    if (
      tournament.entries.length >= 2 &&
      tournament.groupAssignment.length !== tournament.groupCount
    ) {
      onInitGroupAssignment()
    }
  }, [
    tournament.entries.length,
    tournament.groupCount,
    tournament.groupAssignment.length,
    onInitGroupAssignment,
  ])

  const groups = useMemo(() => {
    if (tournament.groupAssignment.length !== tournament.groupCount) {
      // Fall back to ad-hoc snake until persistence is initialized.
      return assignGroups(tournament.entries, tournament.groupCount).groups
    }
    return resolveGroupAssignment(tournament.entries, tournament.groupAssignment)
  }, [
    tournament.entries,
    tournament.groupCount,
    tournament.groupAssignment,
  ])

  const { warnings } = useMemo(
    () => assignGroups(tournament.entries, tournament.groupCount),
    [tournament.entries, tournament.groupCount],
  )

  // Auto-(re)build schedule when groups change. Preserves scores for unchanged matchups.
  useEffect(() => {
    if (tournament.entries.length < 2) {
      if (tournament.groupSchedule.length > 0) onSetGroupSchedule([])
      return
    }
    const expected: GroupMatch[] = []
    groups.forEach((g, idx) => expected.push(...roundRobin(g, idx + 1)))
    const sameSize = expected.length === tournament.groupSchedule.length
    const sameMatches =
      sameSize &&
      expected.every((e, i) => {
        const m = tournament.groupSchedule[i]
        return (
          m &&
          m.group === e.group &&
          m.matchIndex === e.matchIndex &&
          m.entryA === e.entryA &&
          m.entryB === e.entryB
        )
      })
    if (!sameMatches) {
      const scoreMap = new Map<string, { a?: number; b?: number }>()
      for (const m of tournament.groupSchedule) {
        const k = key(m.group, m.entryA, m.entryB)
        scoreMap.set(k, { a: m.scoreA, b: m.scoreB })
      }
      const merged = expected.map((e) => {
        const s = scoreMap.get(key(e.group, e.entryA, e.entryB))
        return { ...e, scoreA: s?.a, scoreB: s?.b }
      })
      onSetGroupSchedule(merged)
    }
  }, [
    groups,
    tournament.entries.length,
    tournament.groupSchedule,
    onSetGroupSchedule,
  ])

  if (tournament.entries.length < 2) {
    return (
      <p className="text-slate-500 text-sm italic">
        Lege zuerst Teilnehmer:innen auf der Teams-Seite an.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm flex items-center gap-2">
          Anzahl Gruppen
          <input
            type="number"
            min={1}
            max={8}
            value={tournament.groupCount}
            onChange={(e) =>
              onSetGroupCount(
                parsePositiveInt(e.target.value, tournament.groupCount),
              )
            }
            className="w-16 rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <span className="text-sm text-slate-500">
          {tournament.entries.length} Teilnehmer · auf {tournament.groupCount}{' '}
          Gruppen verteilt
        </span>
        <button
          type="button"
          onClick={() => {
            const hasScores = tournament.groupSchedule.some(
              (m) => m.scoreA != null || m.scoreB != null,
            )
            if (
              !hasScores ||
              confirm(
                'Gruppen neu auslosen? Alle bisher eingetragenen Ergebnisse gehen verloren.',
              )
            ) {
              onReshuffle()
            }
          }}
          className="rounded border border-slate-300 px-2 py-1 text-sm hover:border-emerald-400"
        >
          Gruppen neu auslosen
        </button>
      </div>

      {warnings.map((w, i) => (
        <div
          key={i}
          role="status"
          aria-live="polite"
          className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800"
        >
          {w}
        </div>
      ))}

      {groups.map((group, gi) => {
        const groupNum = gi + 1
        const matches = tournament.groupSchedule.filter(
          (m) => m.group === groupNum,
        )
        const standings = groupStandings(group, matches)
        return (
          <div
            key={gi}
            className="rounded-md border border-slate-200 bg-white p-3"
          >
            <h3 className="font-semibold mb-2">
              Gruppe {groupLetter(groupNum)} ({group.length} Teams)
            </h3>

            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs">
                    <th className="px-1 py-1 w-10">#</th>
                    <th className="px-1 py-1">Name</th>
                    <th className="px-1 py-1 text-right">Sp</th>
                    <th className="px-1 py-1 text-right">S</th>
                    <th className="px-1 py-1 text-right">U</th>
                    <th className="px-1 py-1 text-right">N</th>
                    <th className="px-1 py-1 text-right">Spiele</th>
                    <th className="px-1 py-1 text-right">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr key={s.entryId} className="border-t border-slate-100">
                      <td className="px-1 py-1 font-semibold">{s.rank}.</td>
                      <td className="px-1 py-1">{s.name}</td>
                      <td className="px-1 py-1 text-right">{s.played}</td>
                      <td className="px-1 py-1 text-right text-emerald-700">
                        {s.wins}
                      </td>
                      <td className="px-1 py-1 text-right text-slate-500">
                        {s.draws}
                      </td>
                      <td className="px-1 py-1 text-right text-rose-700">
                        {s.losses}
                      </td>
                      <td className="px-1 py-1 text-right tabular-nums">
                        {s.gamesFor}:{s.gamesAgainst}
                      </td>
                      <td className="px-1 py-1 text-right tabular-nums font-medium">
                        {s.diff > 0 ? '+' : ''}
                        {s.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <details>
              <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                {matches.length} Spiele
              </summary>
              <div className="mt-2 space-y-1">
                {matches.map((m) => (
                  <GroupMatchRow
                    key={`${m.group}-${m.matchIndex}`}
                    match={m}
                    entries={tournament.entries}
                    onScore={onScore}
                  />
                ))}
              </div>
            </details>
          </div>
        )
      })}
    </div>
  )
}

function GroupMatchRow({
  match,
  entries,
  onScore,
}: {
  match: GroupMatch
  entries: Entry[]
  onScore: Props['onScore']
}) {
  const byId = new Map(entries.map((e) => [e.id, e]))
  const a = byId.get(match.entryA)?.name ?? '?'
  const b = byId.get(match.entryB)?.name ?? '?'
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 text-sm bg-slate-50 px-2 py-1 rounded">
      <span className="truncate">{a}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        placeholder="–"
        value={match.scoreA ?? ''}
        onChange={(e) =>
          onScore(match.group, match.matchIndex, parseScore(e.target.value), match.scoreB)
        }
        className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center"
      />
      <span className="text-slate-400 text-xs">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        placeholder="–"
        value={match.scoreB ?? ''}
        onChange={(e) =>
          onScore(match.group, match.matchIndex, match.scoreA, parseScore(e.target.value))
        }
        className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center"
      />
      <span className="truncate text-right">{b}</span>
    </div>
  )
}

function key(group: number, a: string, b: string) {
  return `${group}|${a}|${b}`
}
