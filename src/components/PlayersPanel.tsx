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
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { Gender, Player } from '../types'
import { useConfirm } from '../hooks/useConfirm'
import { EmptyState } from './EmptyState'

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
  const confirm = useConfirm()
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
      className="flex items-center gap-2 rounded-md border border-border bg-surface p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-fg-subtle hover:text-fg"
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
        className="flex-1 rounded-md border border-transparent px-2 py-1 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none"
      />
      <div className="flex rounded-md border border-border-strong overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'F' })}
          className={
            'px-3 py-1 ' +
            (player.gender === 'F'
              ? 'bg-pink-100 text-pink-800 font-medium'
              : 'bg-surface text-fg-muted hover:bg-surface-muted')
          }
        >
          Dame
        </button>
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'M' })}
          className={
            'px-3 py-1 border-l border-border-strong ' +
            (player.gender === 'M'
              ? 'bg-sky-100 text-sky-800 font-medium'
              : 'bg-surface text-fg-muted hover:bg-surface-muted')
          }
        >
          Herr
        </button>
      </div>
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: `„${player.name}" entfernen?`,
            confirmLabel: 'Entfernen',
            destructive: true,
          })
          if (ok) onRemove(player.id)
        }}
        className="text-fg-subtle hover:text-danger-fg px-2"
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

  const [listRef] = useAutoAnimate<HTMLDivElement>()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Name eingeben…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 min-w-[12rem] rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
        <div className="flex rounded-md border border-border-strong overflow-hidden">
          <button
            type="button"
            onClick={() => setDraftGender('F')}
            className={
              'px-3 py-2 text-sm ' +
              (draftGender === 'F'
                ? 'bg-pink-100 text-pink-800 font-medium'
                : 'bg-surface text-fg-muted hover:bg-surface-muted')
            }
          >
            Dame
          </button>
          <button
            type="button"
            onClick={() => setDraftGender('M')}
            className={
              'px-3 py-2 text-sm border-l border-border-strong ' +
              (draftGender === 'M'
                ? 'bg-sky-100 text-sky-800 font-medium'
                : 'bg-surface text-fg-muted hover:bg-surface-muted')
            }
          >
            Herr
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-brand px-4 py-2 text-white text-sm font-medium hover:bg-brand-hover"
        >
          Hinzufügen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <span>
          {players.length} Spieler:innen ({counts.F} Damen, {counts.M} Herren)
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onSort('name')}
          className="rounded border border-border-strong px-2 py-1 hover:border-brand-hover"
        >
          Sortieren A→Z
        </button>
        <button
          type="button"
          onClick={() => onSort('women-first')}
          className="rounded border border-border-strong px-2 py-1 hover:border-brand-hover"
        >
          Damen zuerst
        </button>
        <button
          type="button"
          onClick={() => onSort('men-first')}
          className="rounded border border-border-strong px-2 py-1 hover:border-brand-hover"
        >
          Herren zuerst
        </button>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon="🎾"
          title="Noch keine Spieler:innen"
          description={'Tippe oben einen Namen ein und wähle Dame/Herr — dann „Hinzufügen".'}
        />
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
            <div ref={listRef} className="space-y-2">
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
