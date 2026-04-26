import { useCallback, useEffect, useRef, useState } from 'react'
import {
  defaultTournament,
  loadTournament,
  saveTournament,
} from '../storage'
import type {
  BracketMatch,
  Entry,
  EntryFormat,
  Format,
  Gender,
  GroupMatch,
  Mode,
  Player,
  Round,
  Tournament,
} from '../types'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export function useTournament() {
  const [tournament, setTournament] = useState<Tournament>(defaultTournament)
  const hydrated = useRef(false)

  useEffect(() => {
    setTournament(loadTournament())
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (hydrated.current) saveTournament(tournament)
  }, [tournament])

  // ---- Rotation: players ---------------------------------------------------

  const setSchedule = useCallback(
    (schedule: Round[]) =>
      setTournament((prev) => ({ ...prev, schedule })),
    [],
  )

  const addPlayer = useCallback((name: string, gender: Gender) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setTournament((prev) => ({
      ...prev,
      players: [...prev.players, { id: newId(), name: trimmed, gender }],
      schedule: [],
    }))
  }, [])

  const updatePlayer = useCallback(
    (id: string, patch: Partial<Pick<Player, 'name' | 'gender'>>) =>
      setTournament((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id
            ? { ...p, ...patch, name: patch.name?.trim() ?? p.name }
            : p,
        ),
      })),
    [],
  )

  const removePlayer = useCallback(
    (id: string) =>
      setTournament((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
        schedule: [],
      })),
    [],
  )

  const setPlayersOrder = useCallback(
    (players: Player[]) =>
      setTournament((prev) => ({ ...prev, players })),
    [],
  )

  const sortPlayersBy = useCallback(
    (criterion: 'name' | 'women-first' | 'men-first') =>
      setTournament((prev) => {
        const next = prev.players.slice()
        if (criterion === 'name') {
          next.sort((a, b) => a.name.localeCompare(b.name, 'de'))
        } else {
          const firstGender: Gender = criterion === 'women-first' ? 'F' : 'M'
          next.sort((a, b) => {
            if (a.gender === b.gender)
              return a.name.localeCompare(b.name, 'de')
            return a.gender === firstGender ? -1 : 1
          })
        }
        return { ...prev, players: next }
      }),
    [],
  )

  // ---- Top-level settings --------------------------------------------------

  const setFormat = useCallback(
    (format: Format) =>
      setTournament((prev) => ({
        ...prev,
        format,
        schedule: [],
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  const setEntryFormat = useCallback(
    (entryFormat: EntryFormat) =>
      setTournament((prev) => ({
        ...prev,
        entryFormat,
        entries: prev.entries.map((e) => ({
          ...e,
          members:
            entryFormat === 'singles'
              ? e.members.slice(0, 1)
              : e.members.length === 1
                ? [...e.members, '']
                : e.members,
        })),
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  const setMode = useCallback(
    (mode: Mode) => setTournament((prev) => ({ ...prev, mode, schedule: [] })),
    [],
  )

  const setCourts = useCallback(
    (courts: number) =>
      setTournament((prev) => ({
        ...prev,
        courts: Math.max(1, Math.min(20, Math.round(courts))),
      })),
    [],
  )

  const setRounds = useCallback(
    (rounds: number) =>
      setTournament((prev) => ({
        ...prev,
        rounds: Math.max(1, Math.min(50, Math.round(rounds))),
        schedule: [],
      })),
    [],
  )

  const setGroupCount = useCallback(
    (groupCount: number) =>
      setTournament((prev) => ({
        ...prev,
        groupCount: Math.max(1, Math.min(8, Math.round(groupCount))),
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  const setAdvancePerGroup = useCallback(
    (advancePerGroup: number) =>
      setTournament((prev) => ({
        ...prev,
        advancePerGroup: Math.max(1, Math.min(4, Math.round(advancePerGroup))),
        bracket: [],
      })),
    [],
  )

  const setName = useCallback(
    (name: string) => setTournament((prev) => ({ ...prev, name })),
    [],
  )

  const setTimerMinutes = useCallback(
    (timerMinutes: number) =>
      setTournament((prev) => ({
        ...prev,
        timerMinutes: Math.max(1, Math.min(120, Math.round(timerMinutes))),
      })),
    [],
  )

  // ---- Entries (groups/KO) -------------------------------------------------

  const addEntry = useCallback((members: string[]) => {
    const cleaned = members.map((m) => m.trim()).filter((m) => m.length > 0)
    if (cleaned.length === 0) return
    setTournament((prev) => {
      const filled =
        prev.entryFormat === 'doubles' && cleaned.length === 1
          ? [...cleaned, '']
          : cleaned
      return {
        ...prev,
        entries: [
          ...prev.entries,
          {
            id: newId(),
            name: deriveEntryName(filled),
            members: filled,
          },
        ],
        groupSchedule: [],
        bracket: [],
      }
    })
  }, [])

  const updateEntry = useCallback(
    (id: string, patch: Partial<Pick<Entry, 'name' | 'members'>>) =>
      setTournament((prev) => ({
        ...prev,
        entries: prev.entries.map((e) => {
          if (e.id !== id) return e
          const members = patch.members
            ? patch.members.map((m) => m.trim()).map((m, i, all) =>
                m === '' && i < all.length - 1 ? '' : m,
              )
            : e.members
          const explicitName = patch.name?.trim()
          const autoName = deriveEntryName(members)
          // If user typed a name, keep it; if user cleared name, regenerate auto.
          const name =
            explicitName !== undefined && explicitName !== ''
              ? explicitName
              : explicitName === ''
                ? autoName
                : isAutoName(e.name, e.members)
                  ? autoName
                  : e.name
          return { ...e, members, name }
        }),
      })),
    [],
  )

  const removeEntry = useCallback(
    (id: string) =>
      setTournament((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== id),
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  const setEntriesOrder = useCallback(
    (entries: Entry[]) =>
      setTournament((prev) => ({
        ...prev,
        entries,
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  const sortEntriesByName = useCallback(
    () =>
      setTournament((prev) => ({
        ...prev,
        entries: prev.entries
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'de')),
        groupSchedule: [],
        bracket: [],
      })),
    [],
  )

  // ---- Schedules / scores --------------------------------------------------

  const setMatchScore = useCallback(
    (
      roundIndex: number,
      court: number,
      scoreA: number | undefined,
      scoreB: number | undefined,
    ) =>
      setTournament((prev) => ({
        ...prev,
        schedule: prev.schedule.map((r) =>
          r.index !== roundIndex
            ? r
            : {
                ...r,
                matches: r.matches.map((m) =>
                  m.court !== court ? m : { ...m, scoreA, scoreB },
                ),
              },
        ),
      })),
    [],
  )

  const setGroupSchedule = useCallback(
    (groupSchedule: GroupMatch[]) =>
      setTournament((prev) => ({ ...prev, groupSchedule })),
    [],
  )

  const setGroupScore = useCallback(
    (
      group: number,
      matchIndex: number,
      scoreA: number | undefined,
      scoreB: number | undefined,
    ) =>
      setTournament((prev) => ({
        ...prev,
        groupSchedule: prev.groupSchedule.map((m) =>
          m.group === group && m.matchIndex === matchIndex
            ? { ...m, scoreA, scoreB }
            : m,
        ),
      })),
    [],
  )

  const setBracket = useCallback(
    (bracket: BracketMatch[]) =>
      setTournament((prev) => ({ ...prev, bracket })),
    [],
  )

  const setBracketScore = useCallback(
    (
      matchId: string,
      scoreA: number | undefined,
      scoreB: number | undefined,
    ) =>
      setTournament((prev) => ({
        ...prev,
        bracket: prev.bracket.map((m) =>
          m.matchId === matchId ? { ...m, scoreA, scoreB } : m,
        ),
      })),
    [],
  )

  const reset = useCallback(() => setTournament(defaultTournament()), [])

  return {
    tournament,
    setSchedule,
    addPlayer,
    updatePlayer,
    removePlayer,
    setPlayersOrder,
    sortPlayersBy,
    setFormat,
    setEntryFormat,
    setMode,
    setCourts,
    setRounds,
    setGroupCount,
    setAdvancePerGroup,
    setName,
    setTimerMinutes,
    addEntry,
    updateEntry,
    removeEntry,
    setEntriesOrder,
    sortEntriesByName,
    setMatchScore,
    setGroupSchedule,
    setGroupScore,
    setBracket,
    setBracketScore,
    reset,
  }
}

function deriveEntryName(members: string[]): string {
  const cleaned = members.map((m) => m.trim()).filter((m) => m.length > 0)
  return cleaned.join(' & ')
}

function isAutoName(name: string, members: string[]): boolean {
  return name === deriveEntryName(members)
}
