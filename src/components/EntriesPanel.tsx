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
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { Entry, EntryFormat } from '../types'
import { useConfirm } from '../hooks/useConfirm'
import { EmptyState } from './EmptyState'

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
  const confirm = useConfirm()
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
      className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2"
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
          className="flex-1 min-w-[8rem] rounded-md border border-transparent px-2 py-1 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      ))}
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: `„${entry.name}" entfernen?`,
            confirmLabel: 'Entfernen',
            destructive: true,
          })
          if (ok) onRemove(entry.id)
        }}
        className="text-fg-subtle hover:text-danger-fg px-2"
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

  const [listRef] = useAutoAnimate<HTMLDivElement>()

  return (
    <div className="space-y-4">
      <div className="text-sm text-fg-muted">
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
            className="flex-1 min-w-[8rem] rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          />
        ))}
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-brand px-4 py-2 text-white text-sm font-medium hover:bg-brand-hover"
        >
          Hinzufügen
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <span>{entries.length} {entryFormat === 'doubles' ? 'Paare' : 'Spieler:innen'}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSortByName}
          className="rounded border border-border-strong px-2 py-1 hover:border-brand-hover"
        >
          Sortieren A→Z
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="👥"
          title={`Noch keine ${entryFormat === 'doubles' ? 'Paare' : 'Teilnehmer:innen'} angelegt`}
          description={'Trage oben die Namen ein und klicke auf „Hinzufügen".'}
        />
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
            <div ref={listRef} className="space-y-2">
              {entries.map((e, i) => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs text-fg-subtle tabular-nums">
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
