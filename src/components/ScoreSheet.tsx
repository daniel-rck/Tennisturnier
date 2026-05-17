import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import { Sheet, Button } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  teamAName: string
  teamBName: string
  scoreA: number | undefined
  scoreB: number | undefined
  onChange: (a: number | undefined, b: number | undefined) => void
}

export function ScoreSheet({
  open,
  onClose,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const [draftA, setDraftA] = useState<number | undefined>(scoreA)
  const [draftB, setDraftB] = useState<number | undefined>(scoreB)

  useEffect(() => {
    if (open) {
      setDraftA(scoreA)
      setDraftB(scoreB)
    }
  }, [open, scoreA, scoreB])

  const commit = (a: number | undefined, b: number | undefined) => {
    setDraftA(a)
    setDraftB(b)
    onChange(a, b)
  }

  const clear = () => {
    commit(undefined, undefined)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('scoreSheet.title', { teamA: teamAName, teamB: teamBName })}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <ScoreColumn
            label={teamAName}
            value={draftA}
            onChange={(n) => commit(n, draftB)}
            ariaLabel={t('scoreSheet.teamAScore', { team: teamAName })}
          />
          <ScoreColumn
            label={teamBName}
            value={draftB}
            onChange={(n) => commit(draftA, n)}
            ariaLabel={t('scoreSheet.teamAScore', { team: teamBName })}
          />
        </div>
        <Keypad
          onDigit={(d) => {
            // Smart-input: alternates A then B as a single tap, but for now we
            // append to the field with focus. To keep things simple here, we treat
            // each digit as a "set to N" for whichever side isn't complete yet.
            if (draftA === undefined) commit(d, draftB)
            else if (draftB === undefined) commit(draftA, d)
            else commit(d, draftB)
          }}
          onBackspace={() => {
            if (draftB !== undefined) commit(draftA, undefined)
            else commit(undefined, draftB)
          }}
        />
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={clear}>
            {t('scoreSheet.clear')}
          </Button>
          <Button onClick={onClose} size="md">
            {t('scoreSheet.done')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}

function ScoreColumn({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label: string
  value: number | undefined
  onChange: (n: number | undefined) => void
  ariaLabel: string
}) {
  const display = value ?? '–'
  return (
    <div className="rounded-card border border-border bg-surface-muted p-3 text-center">
      <div className="text-xs text-fg-muted truncate mb-1" title={label}>
        {label}
      </div>
      <div
        aria-label={ariaLabel}
        className="serif text-5xl font-semibold tabular text-fg leading-none my-2 animate-score-pop"
        key={String(value)}
      >
        {display}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <button
          type="button"
          aria-label={`${ariaLabel} −`}
          onClick={() => onChange(value === undefined ? 0 : Math.max(0, value - 1))}
          className="h-8 w-8 rounded-md border border-border-strong text-fg-muted hover:bg-surface-sunken text-lg leading-none"
        >
          −
        </button>
        <button
          type="button"
          aria-label={`${ariaLabel} +`}
          onClick={() => onChange((value ?? -1) + 1)}
          className="h-8 w-8 rounded-md border border-border-strong text-fg-muted hover:bg-surface-sunken text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  )
}

function Keypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: number) => void
  onBackspace: () => void
}) {
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(d)}
          className="rounded-md bg-surface-sunken hover:bg-surface-muted active:bg-brand-soft active:text-brand-soft-fg text-2xl font-semibold tabular py-3 transition-colors min-h-[56px]"
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="rounded-md bg-surface-sunken hover:bg-surface-muted text-base text-fg-muted py-3 transition-colors min-h-[56px]"
        aria-label="Backspace"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={() => onDigit(0)}
        className="rounded-md bg-surface-sunken hover:bg-surface-muted active:bg-brand-soft active:text-brand-soft-fg text-2xl font-semibold tabular py-3 transition-colors min-h-[56px]"
      >
        0
      </button>
      <span aria-hidden />
    </div>
  )
}
