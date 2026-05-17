import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  min?: number
  max?: number
  onChange: (n: number) => void
  className?: string
  disabled?: boolean
  ariaLabel?: string
  /** Optional id for label-association. */
  id?: string
}

/**
 * Number input that lets the user clear the field while editing without the
 * value snapping back. Commits valid numeric input on every keystroke; on
 * blur, if the draft is empty or invalid, restores the canonical value.
 */
export function NumberInput({
  value,
  min,
  max,
  onChange,
  className = '',
  disabled = false,
  ariaLabel,
  id,
}: Props) {
  const [draft, setDraft] = useState<string>(String(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value))
  }, [value])

  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      disabled={disabled}
      aria-label={ariaLabel}
      onFocus={(e) => {
        focusedRef.current = true
        e.currentTarget.select()
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        if (raw === '') return
        const n = Number(raw)
        if (!Number.isFinite(n)) return
        let next = Math.round(n)
        if (typeof min === 'number') next = Math.max(min, next)
        if (typeof max === 'number') next = Math.min(max, next)
        onChange(next)
      }}
      onBlur={() => {
        focusedRef.current = false
        setDraft(String(value))
      }}
      className={className}
    />
  )
}
