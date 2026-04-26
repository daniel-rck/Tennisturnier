import { useEffect, useState } from 'react'
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
import type { Entry, EntryFormat } from '../types'

interface Props {
  entries: Entry[]
  entryFormat: EntryFormat
  onAdd: (members: string[]) => void
  onUpdate: (id: string, patch: Partial<Pick<Entry, 'name' | 'members'>>) => void
  onRemove: (id: string) => void
  onReorder: (entries: Entry[]) => void
  onSortByName: () => void
}

function EntryRow({
  entry,
  entryFormat,
  onUpdate,
  onRemove,
}: {
  entry: Entry
  entryFormat: EntryFormat
  onUpdate: Props['onUpdate']
  onRemove: Props['onRemove']
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const memberCount = entryFormat === 'singles' ? 1 : 2
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2"
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
      {Array.from({ length: memberCount }).map((_, i) => (
        <input
          key={i}
          type="text"
          value={entry.members[i] ?? ''}
          placeholder={`Spieler:in ${i + 1}`}
          onChange={(e) => {
            const next = entry.members.slice()
            while (next.length < memberCount) next.push('')
            next[i] = e.target.value
            onUpdate(entry.id, { members: next.slice(0, memberCount) })
          }}
          className="flex-1 min-w-[8rem] rounded-md border border-transparent px-2 py-1 hover:border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      ))}
      <button
        type="button"
        onClick={() => {
          if (confirm(`„${entry.name}“ entfernen?`)) onRemove(entry.id)
        }}
        className="text-slate-400 hover:text-rose-600 px-2"
        aria-label="Entfernen"
      >
        ✕
      </button>
    </div>
  )
}

export function EntriesPanel({
  entries,
  entryFormat,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onSortByName,
}: Props) {
  const memberCount = entryFormat === 'singles' ? 1 : 2
  const [drafts, setDrafts] = useState<string[]>(
    Array(memberCount).fill('') as string[],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = entries.findIndex((p) => p.id === active.id)
    const to = entries.findIndex((p) => p.id === over.id)
    if (from === -1 || to === -1) return
    onReorder(arrayMove(entries, from, to))
  }

  const submit = () => {
    if (drafts.every((d) => !d.trim())) return
    onAdd(drafts)
    setDrafts(Array(memberCount).fill('') as string[])
  }

  // Adjust drafts length when entryFormat changes
  useEffect(() => {
    setDrafts((prev) =>
      prev.length === memberCount
        ? prev
        : (Array(memberCount).fill('') as string[]),
    )
  }, [memberCount])

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        {entryFormat === 'doubles' ? (
          <>
            Lege fixe Doppel-Paare an. Reihenfolge = Setzliste (1. = stärkstes
            Team), per Drag-and-Drop änderbar.
          </>
        ) : (
          <>
            Lege Einzelspieler:innen an. Reihenfolge = Setzliste, per
            Drag-and-Drop änderbar.
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: memberCount }).map((_, i) => (
          <input
            key={i}
            type="text"
            placeholder={
              memberCount === 1
                ? 'Name'
                : `Spieler:in ${i + 1}`
            }
            value={drafts[i] ?? ''}
            onChange={(e) => {
              const next = drafts.slice()
              next[i] = e.target.value
              setDrafts(next)
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="flex-1 min-w-[8rem] rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        ))}
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Hinzufügen
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>{entries.length} {entryFormat === 'doubles' ? 'Paare' : 'Spieler:innen'}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSortByName}
          className="rounded border border-slate-300 px-2 py-1 hover:border-emerald-400"
        >
          Sortieren A→Z
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-slate-500 text-sm italic">
          Noch keine {entryFormat === 'doubles' ? 'Paare' : 'Spieler:innen'}{' '}
          angelegt.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={entries.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs text-slate-400 tabular-nums">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <EntryRow
                      entry={e}
                      entryFormat={entryFormat}
                      onUpdate={onUpdate}
                      onRemove={onRemove}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
