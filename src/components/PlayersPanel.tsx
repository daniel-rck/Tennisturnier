import { useRef, useState } from 'react'
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
import { useTranslation } from '../i18n'
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
  const { t } = useTranslation()
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
        className="icon-btn cursor-grab active:cursor-grabbing touch-none text-fg-subtle"
        aria-label={t('common.move')}
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate(player.id, { name: e.target.value })}
        className="flex-1 min-w-0 h-10 rounded-md border border-transparent px-2 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none"
      />
      <div className="flex rounded-md border border-border-strong overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'F' })}
          aria-pressed={player.gender === 'F'}
          aria-label={t('gender.female')}
          className={
            'inline-flex items-center gap-1 px-3 min-h-[40px] ' +
            (player.gender === 'F'
              ? 'bg-pink-100 text-pink-800 font-medium dark:bg-pink-900/40 dark:text-pink-200'
              : 'bg-surface text-fg-muted hover:bg-surface-muted')
          }
        >
          <span aria-hidden>♀</span>
          <span>{t('gender.female')}</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdate(player.id, { gender: 'M' })}
          aria-pressed={player.gender === 'M'}
          aria-label={t('gender.male')}
          className={
            'inline-flex items-center gap-1 px-3 min-h-[40px] border-l border-border-strong ' +
            (player.gender === 'M'
              ? 'bg-sky-100 text-sky-800 font-medium dark:bg-sky-900/40 dark:text-sky-200'
              : 'bg-surface text-fg-muted hover:bg-surface-muted')
          }
        >
          <span aria-hidden>♂</span>
          <span>{t('gender.male')}</span>
        </button>
      </div>
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: t('players.removeConfirm.title', { name: player.name }),
            confirmLabel: t('common.remove'),
            destructive: true,
          })
          if (ok) onRemove(player.id)
        }}
        className="icon-btn hover:text-danger-fg hover:bg-danger-bg/30"
        aria-label={t('common.remove')}
      >
        ✕
      </button>
    </div>
  )
}

function DragHandleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
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
  const { t } = useTranslation()
  const [draftName, setDraftName] = useState('')
  const [draftGender, setDraftGender] = useState<Gender>('F')
  const nameInputRef = useRef<HTMLInputElement>(null)

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
          ref={nameInputRef}
          type="text"
          placeholder={t('players.namePlaceholder')}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="flex-1 min-w-[12rem] min-h-[44px] rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
        <div className="flex rounded-md border border-border-strong overflow-hidden">
          <button
            type="button"
            onClick={() => setDraftGender('F')}
            aria-pressed={draftGender === 'F'}
            aria-label={t('gender.female')}
            className={
              'inline-flex items-center gap-1 px-3 text-sm min-h-[44px] ' +
              (draftGender === 'F'
                ? 'bg-pink-100 text-pink-800 font-medium dark:bg-pink-900/40 dark:text-pink-200'
                : 'bg-surface text-fg-muted hover:bg-surface-muted')
            }
          >
            <span aria-hidden>♀</span>
            <span>{t('gender.female')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDraftGender('M')}
            aria-pressed={draftGender === 'M'}
            aria-label={t('gender.male')}
            className={
              'inline-flex items-center gap-1 px-3 text-sm min-h-[44px] border-l border-border-strong ' +
              (draftGender === 'M'
                ? 'bg-sky-100 text-sky-800 font-medium dark:bg-sky-900/40 dark:text-sky-200'
                : 'bg-surface text-fg-muted hover:bg-surface-muted')
            }
          >
            <span aria-hidden>♂</span>
            <span>{t('gender.male')}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          className="btn-primary"
        >
          {t('common.add')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <span>
          {t('players.count', { count: players.length, women: counts.F, men: counts.M })}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => onSort('name')}
          className="rounded-md border border-border-strong px-3 py-1.5 min-h-[36px] hover:border-brand-hover"
        >
          {t('common.sortAZ')}
        </button>
        <button
          type="button"
          onClick={() => onSort('women-first')}
          className="rounded-md border border-border-strong px-3 py-1.5 min-h-[36px] hover:border-brand-hover"
        >
          {t('players.sortWomenFirst')}
        </button>
        <button
          type="button"
          onClick={() => onSort('men-first')}
          className="rounded-md border border-border-strong px-3 py-1.5 min-h-[36px] hover:border-brand-hover"
        >
          {t('players.sortMenFirst')}
        </button>
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon="🎾"
          title={t('players.empty.title')}
          description={t('players.empty.description')}
          action={
            <button
              type="button"
              onClick={() => nameInputRef.current?.focus()}
              className="btn-primary"
            >
              {t('players.empty.action')}
            </button>
          }
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
