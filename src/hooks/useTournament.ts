import { useCallback, useEffect, useRef, useState } from 'react'
import {
  defaultTournament,
  loadTournament,
  saveTournament,
} from '../storage'
import type { Gender, Mode, Player, Round, Tournament } from '../types'

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

  const setMode = useCallback(
    (mode: Mode) => setTournament((prev) => ({ ...prev, mode, schedule: [] })),
    [],
  )

  const setCourts = useCallback(
    (courts: number) =>
      setTournament((prev) => ({
        ...prev,
        courts: Math.max(1, Math.min(20, Math.round(courts))),
        schedule: [],
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

  const reset = useCallback(() => setTournament(defaultTournament()), [])

  return {
    tournament,
    setSchedule,
    addPlayer,
    updatePlayer,
    removePlayer,
    setPlayersOrder,
    sortPlayersBy,
    setMode,
    setCourts,
    setRounds,
    setName,
    setTimerMinutes,
    setMatchScore,
    reset,
  }
}
