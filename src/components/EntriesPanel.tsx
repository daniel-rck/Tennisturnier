import { useEffect, useRef, useState } from 'react'
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
import { useTranslation } from '../i18n'
import { EmptyState } from './EmptyState'
import { Avatar, Button, Card, Pill, Sheet } from './ui'

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
  seed,
  onUpdate,
  onRemove,
}: {
  entry: Entry
  entryFormat: EntryFormat
  seed: number
  onUpdate: Props['onUpdate']
  onRemove: Props['onRemove']
}) {
  const confirm = useConfirm()
  const { t } = useTranslation()
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
      className="rounded-card border border-border bg-surface shadow-card p-2.5"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center min-w-[28px] min-h-[40px] rounded-md cursor-grab active:cursor-grabbing touch-none text-fg-subtle hover:text-fg hover:bg-surface-sunken"
          aria-label={t('common.move')}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon />
        </button>
        <span className="serif text-sm font-semibold text-fg-muted w-6 text-right tabular shrink-0">
          {seed}.
        </span>
        {entryFormat === 'singles' ? (
          <>
            <Avatar name={entry.members[0] ?? entry.name} size="sm" />
            <input
              type="text"
              value={entry.members[0] ?? ''}
              placeholder={t('entries.placeholder.name')}
              onChange={(e) => onUpdate(entry.id, { members: [e.target.value] })}
              className="flex-1 min-w-0 h-10 rounded-md border border-transparent px-2 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-transparent"
            />
          </>
        ) : (
          <>
            <div className="flex -space-x-1.5 shrink-0">
              <Avatar name={entry.members[0] ?? 'A'} size="sm" />
              <Avatar name={entry.members[1] ?? 'B'} size="sm" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              {Array.from({ length: memberCount }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  value={entry.members[i] ?? ''}
                  placeholder={t('entries.placeholder.member', { n: i + 1 })}
                  onChange={(e) => {
                    const next = entry.members.slice()
                    while (next.length < memberCount) next.push('')
                    next[i] = e.target.value
                    onUpdate(entry.id, { members: next.slice(0, memberCount) })
                  }}
                  className="min-w-0 h-10 rounded-md border border-transparent px-2 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-transparent text-sm"
                />
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: t('entries.removeConfirm.title', { name: entry.name }),
              confirmLabel: t('common.remove'),
              destructive: true,
            })
            if (ok) onRemove(entry.id)
          }}
          className="inline-flex items-center justify-center min-w-[40px] min-h-[44px] rounded-md text-fg-subtle hover:text-danger-fg hover:bg-danger-bg/40 transition-colors"
          aria-label={t('common.remove')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function DragHandleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
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
  const { t } = useTranslation()
  const memberCount = entryFormat === 'singles' ? 1 : 2
  const [drafts, setDrafts] = useState<string[]>(
    Array(memberCount).fill('') as string[],
  )
  const [bulkOpen, setBulkOpen] = useState(false)
  const firstDraftRef = useRef<HTMLInputElement>(null)

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
    firstDraftRef.current?.focus()
  }

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
      <p className="text-sm text-fg-muted">
        {entryFormat === 'doubles' ? t('entries.descDoubles') : t('entries.descSingles')}
      </p>

      <Card variant="flat" className="p-3 space-y-2 sticky top-[112px] sm:top-[160px] z-[4]">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: memberCount }).map((_, i) => (
            <input
              key={i}
              ref={i === 0 ? firstDraftRef : undefined}
              type="text"
              placeholder={
                memberCount === 1
                  ? t('entries.placeholder.name')
                  : t('entries.placeholder.member', { n: i + 1 })
              }
              value={drafts[i] ?? ''}
              onChange={(e) => {
                const next = drafts.slice()
                next[i] = e.target.value
                setDrafts(next)
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="flex-1 min-w-[8rem] min-h-[44px] rounded-md border border-border-strong bg-surface px-3 py-2 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none"
            />
          ))}
          <Button onClick={submit} variant="primary" size="md">
            {t('common.add')}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-fg-muted">
            <span className="font-semibold text-fg tabular">{entries.length}</span>{' '}
            {entryFormat === 'doubles' ? 'Teams' : 'Spieler:innen'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="text-brand hover:underline font-medium"
            >
              + {t('players.bulkImport')}
            </button>
            <button
              type="button"
              onClick={onSortByName}
              className="text-fg-muted hover:text-fg font-medium"
            >
              {t('common.sortAZ')}
            </button>
          </div>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          icon="👥"
          title={
            entryFormat === 'doubles'
              ? t('entries.empty.titleDoubles')
              : t('entries.empty.titleSingles')
          }
          description={t('entries.empty.description')}
          action={
            <Button onClick={() => firstDraftRef.current?.focus()}>
              {entryFormat === 'doubles'
                ? t('entries.empty.actionDoubles')
                : t('entries.empty.actionSingles')}
            </Button>
          }
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
                <EntryRow
                  key={e.id}
                  entry={e}
                  entryFormat={entryFormat}
                  seed={i + 1}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <BulkEntriesSheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onAdd={onAdd}
        entryFormat={entryFormat}
      />
    </div>
  )
}

function BulkEntriesSheet({
  open,
  onClose,
  onAdd,
  entryFormat,
}: {
  open: boolean
  onClose: () => void
  onAdd: (members: string[]) => void
  entryFormat: EntryFormat
}) {
  const { t } = useTranslation()
  const [raw, setRaw] = useState('')

  const parsed: string[][] = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (entryFormat === 'singles') return [line]
      const parts = line.split(/&|\+/).map((s) => s.trim()).filter(Boolean)
      return parts.slice(0, 2)
    })
    .filter((parts) => parts.length > 0)

  const submit = () => {
    parsed.forEach((members) => onAdd(members))
    setRaw('')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('entries.bulkImport.title')}
      description={
        entryFormat === 'doubles'
          ? t('entries.bulkImport.descriptionDoubles')
          : t('entries.bulkImport.descriptionSingles')
      }
    >
      <div className="space-y-3">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={
            entryFormat === 'doubles'
              ? t('entries.bulkImport.placeholderDoubles')
              : t('entries.bulkImport.placeholderSingles')
          }
          rows={8}
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-mono focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none resize-y"
        />
        {parsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {parsed.slice(0, 8).map((members, i) => (
              <Pill key={i} tone="brand">
                {members.join(' & ')}
              </Pill>
            ))}
            {parsed.length > 8 && <Pill tone="neutral">+{parsed.length - 8}</Pill>}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={parsed.length === 0}>
            {t('players.bulkImport.add', { count: parsed.length })}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
