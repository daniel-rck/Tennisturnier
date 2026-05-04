import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number | undefined
  onChange: (next: number | undefined) => void
  ariaLabel: string
  disabled?: boolean
  min?: number
  max?: number
}

export function ScoreInput({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  min = 0,
  max = 99,
}: Props) {
  const [draft, setDraft] = useState<string>(value?.toString() ?? '')
  const isFocused = useRef(false)

  // Sync from parent only when not focused, so the user can freely clear
  // the field while typing a new value (e.g. backspacing "5" before typing "10").
  useEffect(() => {
    if (!isFocused.current) {
      setDraft(value?.toString() ?? '')
    }
  }, [value])

  function handleChange(raw: string) {
    if (raw === '') {
      setDraft('')
      onChange(undefined)
      return
    }
    if (!/^\d{1,2}$/.test(raw)) return
    const n = Number(raw)
    if (n > max || n < min) return
    setDraft(raw)
    onChange(n)
  }

  function step(delta: number) {
    if (value === undefined) {
      if (delta > 0) {
        setDraft(min.toString())
        onChange(min)
      }
      return
    }
    const next = Math.min(max, Math.max(min, value + delta))
    if (next === value) return
    setDraft(next.toString())
    onChange(next)
  }

  const stepperBtn =
    'h-7 w-6 shrink-0 rounded border border-border-strong text-fg-muted text-base leading-none ' +
    'hover:bg-surface-muted hover:text-fg active:bg-surface-sunken ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'

  const minusDisabled = disabled || value === undefined || value <= min
  const plusDisabled = disabled || (value !== undefined && value >= max)

  return (
    <div className="inline-flex items-stretch gap-0.5">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={minusDisabled}
        aria-label={`${ariaLabel} verringern`}
        tabIndex={-1}
        className={stepperBtn}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        autoComplete="off"
        placeholder="–"
        value={draft}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => {
          isFocused.current = true
          e.target.select()
        }}
        onBlur={() => {
          isFocused.current = false
          setDraft(value?.toString() ?? '')
        }}
        className="w-10 rounded border border-border-strong px-1 py-0.5 text-center text-sm tabular-nums disabled:bg-surface-sunken disabled:text-fg-subtle"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={plusDisabled}
        aria-label={`${ariaLabel} erhöhen`}
        tabIndex={-1}
        className={stepperBtn}
      >
        +
      </button>
    </div>
  )
}
