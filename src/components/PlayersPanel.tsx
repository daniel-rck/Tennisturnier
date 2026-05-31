import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRef, useState } from "react";
import { useConfirm } from "../hooks/useConfirm";
import { useTranslation } from "../i18n";
import type { Gender, Player } from "../types";
import { EmptyState } from "./EmptyState";
import { Avatar, Button, Card, Pill, Sheet } from "./ui";

interface Props {
  players: Player[];
  onAdd: (name: string, gender: Gender) => void;
  onUpdate: (id: string, patch: Partial<Pick<Player, "name" | "gender">>) => void;
  onRemove: (id: string) => void;
  onSort: (criterion: "name" | "women-first" | "men-first") => void;
  onArrayMove: (newOrder: Player[]) => void;
  /** Optional continue CTA — appears as a sticky footer once the minimum
   *  number of players is reached. Wires up the "go to next phase" flow. */
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabledHint?: string;
  /** Minimum players needed before onContinue becomes active. Defaults to 4. */
  minPlayers?: number;
}

function PlayerRow({
  player,
  onUpdate,
  onRemove,
}: {
  player: Player;
  onUpdate: Props["onUpdate"];
  onRemove: Props["onRemove"];
}) {
  const confirm = useConfirm();
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-card border border-border bg-surface p-2 shadow-card"
    >
      <button
        type="button"
        className="inline-flex items-center justify-center min-w-[28px] min-h-[44px] rounded-md cursor-grab active:cursor-grabbing touch-none text-fg-subtle hover:text-fg hover:bg-surface-sunken"
        aria-label={t("common.move")}
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      <Avatar name={player.name} gender={player.gender} size="md" />
      <input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate(player.id, { name: e.target.value })}
        className="flex-1 min-w-0 h-10 rounded-md border border-transparent px-2 hover:border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-transparent"
      />
      <GenderToggle value={player.gender} onChange={(g) => onUpdate(player.id, { gender: g })} />
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: t("players.removeConfirm.title", { name: player.name }),
            confirmLabel: t("common.remove"),
            destructive: true,
          });
          if (ok) onRemove(player.id);
        }}
        className="inline-flex items-center justify-center min-w-[40px] min-h-[44px] rounded-md text-fg-subtle hover:text-danger-fg hover:bg-danger-bg/40 transition-colors"
        aria-label={t("common.remove")}
      >
        ✕
      </button>
    </div>
  );
}

function GenderToggle({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
  const { t } = useTranslation();
  return (
    // biome-ignore lint/a11y/useSemanticElements: this is a custom pill-styled toggle of two aria-pressed buttons; a native <fieldset> would require a <legend> and impose default form styling/semantics that break the inline-flex rounded pill layout. role="group" + aria-label is the correct ARIA for this grouping.
    <div
      role="group"
      aria-label="Geschlecht"
      className="inline-flex items-center rounded-full bg-surface-sunken p-0.5 text-xs"
    >
      <button
        type="button"
        onClick={() => onChange("F")}
        aria-pressed={value === "F"}
        aria-label={t("gender.female")}
        className={[
          "inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-full px-2.5 font-semibold transition-colors",
          value === "F" ? "bg-clay text-white shadow-sm" : "text-fg-muted hover:text-fg",
        ].join(" ")}
      >
        ♀
      </button>
      <button
        type="button"
        onClick={() => onChange("M")}
        aria-pressed={value === "M"}
        aria-label={t("gender.male")}
        className={[
          "inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-full px-2.5 font-semibold transition-colors",
          value === "M" ? "bg-court text-white shadow-sm" : "text-fg-muted hover:text-fg",
        ].join(" ")}
      >
        ♂
      </button>
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
  );
}

export function PlayersPanel({
  players,
  onAdd,
  onUpdate,
  onRemove,
  onSort,
  onArrayMove,
  onContinue,
  continueLabel,
  continueDisabledHint,
  minPlayers = 4,
}: Props) {
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState("");
  const [draftGender, setDraftGender] = useState<Gender>("F");
  const [bulkOpen, setBulkOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = players.findIndex((p) => p.id === active.id);
    const to = players.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;
    onArrayMove(arrayMove(players, from, to));
  };

  const submit = () => {
    if (!draftName.trim()) return;
    onAdd(draftName, draftGender);
    setDraftName("");
    nameInputRef.current?.focus();
  };

  const counts = {
    F: players.filter((p) => p.gender === "F").length,
    M: players.filter((p) => p.gender === "M").length,
  };

  const [listRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <div className="space-y-4">
      {/* Sticky add-bar */}
      <Card variant="flat" className="p-3 space-y-2 sticky top-[112px] sm:top-[160px] z-[4]">
        <div className="flex gap-2">
          <input
            ref={nameInputRef}
            type="text"
            placeholder={t("players.namePlaceholder")}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="flex-1 min-w-0 min-h-[44px] rounded-md border border-border-strong bg-surface px-3 py-2 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none"
          />
          <GenderToggle value={draftGender} onChange={setDraftGender} />
          <Button onClick={submit} variant="primary" size="md">
            {t("common.add")}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-fg-muted">
            <span className="font-semibold text-fg tabular">{players.length}</span> ·{" "}
            <span className="text-clay">♀ {counts.F}</span> ·{" "}
            <span className="text-court">♂ {counts.M}</span>
          </span>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="text-brand hover:underline font-medium"
          >
            + {t("players.bulkImport")}
          </button>
        </div>
      </Card>

      {players.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle">
            Sort
          </span>
          <SortPill onClick={() => onSort("name")}>A→Z</SortPill>
          <SortPill onClick={() => onSort("women-first")}>♀ first</SortPill>
          <SortPill onClick={() => onSort("men-first")}>♂ first</SortPill>
        </div>
      )}

      {players.length === 0 ? (
        <EmptyState
          icon="🎾"
          title={t("players.empty.title")}
          description={t("players.empty.description")}
          action={
            <Button onClick={() => nameInputRef.current?.focus()}>
              {t("players.empty.action")}
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div ref={listRef} className="space-y-2">
              {players.map((p) => (
                <PlayerRow key={p.id} player={p} onUpdate={onUpdate} onRemove={onRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <BulkImportSheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onAdd={onAdd}
        defaultGender={draftGender}
      />

      {onContinue && (
        <ContinueBar
          count={players.length}
          minimum={minPlayers}
          onContinue={onContinue}
          label={continueLabel}
          disabledHint={continueDisabledHint}
        />
      )}
    </div>
  );
}

function ContinueBar({
  count,
  minimum,
  onContinue,
  label,
  disabledHint,
}: {
  count: number;
  minimum: number;
  onContinue: () => void;
  label?: string;
  disabledHint?: string;
}) {
  const { t } = useTranslation();
  const ready = count >= minimum;
  const fallbackLabel = label ?? t("wizard.finish");
  return (
    <div
      className="sticky bottom-[68px] sm:bottom-4 z-[5]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="rounded-card border border-border bg-surface/95 backdrop-blur-md shadow-elevated p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0 text-sm">
          {ready ? (
            <span className="text-fg-muted">
              <span className="font-semibold text-fg tabular">{count}</span> Teilnehmer:innen bereit
            </span>
          ) : (
            <span className="text-fg-muted">
              {disabledHint ?? t("schedule.minPlayersWarning")}{" "}
              <span className="tabular">
                ({count}/{minimum})
              </span>
            </span>
          )}
        </div>
        <Button
          variant={ready ? "primary" : "secondary"}
          onClick={onContinue}
          disabled={!ready}
          size="md"
        >
          {fallbackLabel}
        </Button>
      </div>
    </div>
  );
}

function SortPill({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full bg-surface-sunken hover:bg-surface-muted px-3 py-1 text-xs font-medium text-fg-muted hover:text-fg transition-colors min-h-[32px]"
    >
      {children}
    </button>
  );
}

function BulkImportSheet({
  open,
  onClose,
  onAdd,
  defaultGender,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, gender: Gender) => void;
  defaultGender: Gender;
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState("");

  const parsed = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(/[;,]/).map((s) => s.trim());
      const name = parts[0] ?? "";
      const tag = (parts[1] ?? "").toLowerCase();
      const gender: Gender =
        tag === "m" || tag === "h"
          ? "M"
          : tag === "f" || tag === "w" || tag === "d"
            ? "F"
            : defaultGender;
      return { name, gender };
    })
    .filter((p) => p.name.length > 0);

  const submit = () => {
    parsed.forEach((p) => {
      onAdd(p.name, p.gender);
    });
    setRaw("");
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("players.bulkImport.title")}
      description={t("players.bulkImport.description")}
    >
      <div className="space-y-3">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t("players.bulkImport.placeholder")}
          rows={8}
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-mono focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none resize-y"
        />
        {parsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {parsed.slice(0, 12).map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: read-only preview of free-text-parsed players that may contain duplicate names; the positional index is needed to keep keys unique within this static list.
              <Pill key={`${p.name}-${i}`} tone={p.gender === "F" ? "gold" : "brand"}>
                {p.name} {p.gender === "F" ? "♀" : "♂"}
              </Pill>
            ))}
            {parsed.length > 12 && <Pill tone="neutral">+{parsed.length - 12}</Pill>}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={parsed.length === 0}>
            {t("players.bulkImport.add", { count: parsed.length })}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
