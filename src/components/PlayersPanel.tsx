import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Gender, Player } from '../types'

interface Props {
  players: Player[]
  onAdd: (name: string, gender: Gender) => void
  onUpdate: (id: string, patch: Partial<Pick<Player, 'name' | 'gender'>>) => void
  onRemove: (id: string) => void
  onSort: (criterion: 'name' | 'women-first' | 'men-first') => void
  onArrayMove: (newOrder: Player[]) => void
}

interface RowProps {
  player: Player
  onUpdate: Props['onUpdate']
  onRemove: Props['onRemove']
}

function PlayerRow({ player, onUpdate, onRemove }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: player.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-slate-400 hover:text-slate-700"
        aria-label="Verschieben"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate(player.id, { name: e.target.value })}
        className="flex-1 rounded-md border border-transparent px-2 py-1 hover:border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
      />
      <div className="flex rounded-md border border-slate-300 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'F' })}
          className={
            'px-3 py-1 ' +
            (player.gender === 'F'
              ? 'bg-pink-100 text-pink-800 font-medium'
              : 'bg-white text-slate-600 hover:bg-slate-50')
          }
        >
          Dame
        </button>
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'M' })}
          className={
            'px-3 py-1 border-l border-slate-300 ' +
            (player.gender === 'M'
              ? 'bg-sky-100 text-sky-800 font-medium'
              : 'bg-white text-slate-600 hover:bg-slate-50')
          }
        >
          Herr
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          if (confirm(`„${player.name}" entfernen?`)) onRemove(player.id)
        }}
        className="text-slate-400 hover:text-rose-600 px-2"
        aria-label="Entfernen"
      >
        ✕
      </button>
    </div>
  )
}

export function PlayersPanel({
  players,
  onAdd,
  onUpdate,
  onRemove,
  onSort,
  onArrayMove,
}: Props) {
  const [draftName, setDraftName] = useState('')
  const [draftGender, setDraftGender] = useState<Gender>('F')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = players.findIndex((p) => p.id === active.id)
    const to = players.findIndex((p) => p.id === over.id)
    if (from === -1 || to === -1) return
    onArrayMove(arrayMove(players, from, to))
  }

  const submit = () => {
    if (!draftName.trim()) return
    onAdd(draftName, draftGender)
    setDraftName('')
  }

  const counts = {
    F: players.filter((p) => p.gender === 'F').length,
    M: players.filter((p) => p.gender === 'M').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Name eingeben…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 min-w-[12rem] rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <div className="flex rounded-md border border-slate-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setDraftGender('F')}
            className={
              'px-3 py-2 text-sm ' +
              (draftGender === 'F'
                ? 'bg-pink-100 text-pink-800 font-medium'
                : 'bg-white text-slate-600 hover:bg-slate-50')
            }
          >
            Dame
          </button>
          <button
            type="button"
            onClick={() => setDraftGender('M')}
            className={
              'px-3 py-2 text-sm border-l border-slate-300 ' +
              (draftGender === 'M'
                ? 'bg-sky-100 text-sky-800 font-medium'
                : 'bg-white text-slate-600 hover:bg-slate-50')
            }
          >
            Herr
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Hinzufügen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>
          {players.length} Spieler:innen ({counts.F} Damen, {counts.M} Herren)
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onSort('name')}
          className="rounded border border-slate-300 px-2 py-1 hover:border-emerald-400"
        >
          Sortieren A→Z
        </button>
        <button
          type="button"
          onClick={() => onSort('women-first')}
          className="rounded border border-slate-300 px-2 py-1 hover:border-emerald-400"
        >
          Damen zuerst
        </button>
        <button
          type="button"
          onClick={() => onSort('men-first')}
          className="rounded border border-slate-300 px-2 py-1 hover:border-emerald-400"
        >
          Herren zuerst
        </button>
      </div>

      {players.length === 0 ? (
        <p className="text-slate-500 text-sm italic">
          Noch keine Spieler:innen hinzugefügt.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={players.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {players.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
