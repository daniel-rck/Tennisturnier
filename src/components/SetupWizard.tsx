import { useState } from 'react'
import type { EntryFormat, Format, Mode } from '../types'
import { ENTRY_FORMAT_KEYS, FORMAT_KEYS, MODE_KEYS } from '../types'
import { parsePositiveInt } from '../utils/parseScore'
import { useTranslation, type TranslationKey } from '../i18n'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { SegmentedControl } from './ui/SegmentedControl'

interface Props {
  name: string
  format: Format
  entryFormat: EntryFormat
  courts: number
  rounds: number
  mode: Mode
  allowPartialFinalRound: boolean
  groupCount: number
  advancePerGroup: number
  thirdPlaceMatch: boolean
  perGenderRanking: boolean
  onName: (s: string) => void
  onFormat: (f: Format) => void
  onEntryFormat: (f: EntryFormat) => void
  onCourts: (n: number) => void
  onRounds: (n: number) => void
  onMode: (m: Mode) => void
  onAllowPartialFinalRound: (b: boolean) => void
  onGroupCount: (n: number) => void
  onAdvancePerGroup: (n: number) => void
  onThirdPlaceMatch: (b: boolean) => void
  onPerGenderRanking: (b: boolean) => void
  /** Called when wizard is finished (user hit "Finish"). */
  onFinish: () => void
}

const FORMAT_DESC_KEYS: Record<Format, TranslationKey> = {
  rotation: 'wizard.format.rotation.desc',
  groups: 'wizard.format.groups.desc',
  knockout: 'wizard.format.knockout.desc',
  'groups-ko': 'wizard.format.groups-ko.desc',
}

const FORMAT_ICONS: Record<Format, string> = {
  rotation: '🔁',
  groups: '🗂️',
  knockout: '🎯',
  'groups-ko': '🏆',
}

type Step = 0 | 1 | 2

export function SetupWizard(props: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(0)

  return (
    <div className="space-y-5">
      <Stepper step={step} />

      {step === 0 && (
        <StepFormat
          name={props.name}
          format={props.format}
          onName={props.onName}
          onFormat={props.onFormat}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <StepDetails
          {...props}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepPlayers onBack={() => setStep(1)} onFinish={props.onFinish} />
      )}
    </div>
  )

  function Stepper({ step }: { step: Step }) {
    const labels: TranslationKey[] = [
      'wizard.step.format',
      'wizard.step.details',
      'wizard.step.players',
    ]
    return (
      <ol className="flex items-center gap-2" aria-label="Wizard steps">
        {labels.map((label, i) => {
          const reached = step >= (i as Step)
          const current = step === i
          return (
            <li key={label} className="flex-1 flex items-center gap-2 min-w-0">
              <div
                aria-current={current ? 'step' : undefined}
                className={[
                  'flex items-center gap-2 min-w-0',
                  reached ? 'text-fg' : 'text-fg-subtle',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0',
                    current
                      ? 'bg-brand text-white'
                      : reached
                        ? 'bg-brand-soft text-brand-soft-fg'
                        : 'bg-surface-sunken text-fg-subtle',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider truncate">
                  {t(label)}
                </span>
              </div>
              {i < labels.length - 1 && (
                <span
                  aria-hidden
                  className={`h-px flex-1 ${
                    step > (i as Step) ? 'bg-brand-soft' : 'bg-border'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    )
  }
}

function StepFormat({
  name,
  format,
  onName,
  onFormat,
  onNext,
}: {
  name: string
  format: Format
  onName: (s: string) => void
  onFormat: (f: Format) => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <h2 className="serif text-2xl font-semibold">{t('wizard.title.format')}</h2>

      <Card variant="flat" className="p-4 space-y-2">
        <label className="block text-sm font-medium text-fg">
          {t('setup.tournamentName')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={t('app.defaultName')}
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 text-base focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none"
        />
      </Card>

      <div className="space-y-2">
        <div className="text-sm font-medium text-fg">{t('setup.format')}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(Object.keys(FORMAT_KEYS) as Format[]).map((f) => {
            const active = f === format
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFormat(f)}
                aria-pressed={active}
                className={[
                  'text-left rounded-card border px-4 py-3.5 transition-all min-h-[80px]',
                  active
                    ? 'border-brand bg-brand-soft shadow-card'
                    : 'border-border bg-surface hover:border-brand-hover',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {FORMAT_ICONS[f]}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-fg">{t(FORMAT_KEYS[f])}</div>
                    <div className="text-xs text-fg-muted mt-0.5">
                      {t(FORMAT_DESC_KEYS[f])}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} size="lg">
          {t('wizard.next')}
        </Button>
      </div>
    </div>
  )
}

function StepDetails(
  props: Props & { onBack: () => void; onNext: () => void },
) {
  const { t } = useTranslation()
  const {
    format,
    entryFormat,
    courts,
    rounds,
    mode,
    allowPartialFinalRound,
    groupCount,
    advancePerGroup,
    thirdPlaceMatch,
    perGenderRanking,
    onEntryFormat,
    onCourts,
    onRounds,
    onMode,
    onAllowPartialFinalRound,
    onGroupCount,
    onAdvancePerGroup,
    onThirdPlaceMatch,
    onPerGenderRanking,
    onBack,
    onNext,
  } = props

  return (
    <div className="space-y-5">
      <h2 className="serif text-2xl font-semibold">{t('wizard.title.details')}</h2>

      <Card variant="flat" className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t('setup.courts')}
            value={courts}
            min={1}
            max={20}
            onChange={onCourts}
          />
          {format === 'rotation' && (
            <NumberField
              label={t('setup.rounds')}
              value={rounds}
              min={1}
              max={50}
              onChange={onRounds}
            />
          )}
          {(format === 'groups' || format === 'groups-ko') && (
            <NumberField
              label={t('setup.groupCount')}
              value={groupCount}
              min={1}
              max={8}
              onChange={onGroupCount}
            />
          )}
        </div>
        {format === 'groups-ko' && (
          <NumberField
            label={t('setup.advancePerGroup')}
            value={advancePerGroup}
            min={1}
            max={4}
            onChange={onAdvancePerGroup}
          />
        )}
      </Card>

      {format === 'rotation' && (
        <Card variant="flat" className="p-4 space-y-3">
          <div className="text-sm font-medium">{t('setup.doublesMode')}</div>
          <SegmentedControl<Mode>
            value={mode}
            onChange={onMode}
            ariaLabel={t('setup.doublesMode')}
            options={(Object.keys(MODE_KEYS) as Mode[]).map((m) => ({
              value: m,
              label: t(MODE_KEYS[m]),
            }))}
          />
          <CheckRow
            label={t('setup.partialFinal')}
            hint={t('setup.partialFinalHint')}
            checked={allowPartialFinalRound}
            onChange={onAllowPartialFinalRound}
          />
          {mode === 'mixed' && (
            <CheckRow
              label={t('setup.perGenderRanking')}
              hint={t('setup.perGenderRankingHint')}
              checked={perGenderRanking}
              onChange={onPerGenderRanking}
            />
          )}
        </Card>
      )}

      {(format === 'groups' || format === 'knockout' || format === 'groups-ko') && (
        <Card variant="flat" className="p-4 space-y-3">
          <div className="text-sm font-medium">{t('setup.entryFormat')}</div>
          <SegmentedControl<EntryFormat>
            value={entryFormat}
            onChange={onEntryFormat}
            ariaLabel={t('setup.entryFormat')}
            options={(Object.keys(ENTRY_FORMAT_KEYS) as EntryFormat[]).map((f) => ({
              value: f,
              label: t(ENTRY_FORMAT_KEYS[f]),
            }))}
          />
          {(format === 'knockout' || format === 'groups-ko') && (
            <CheckRow
              label={t('setup.thirdPlace')}
              hint={t('setup.thirdPlaceHint')}
              checked={thirdPlaceMatch}
              onChange={onThirdPlaceMatch}
            />
          )}
        </Card>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} size="lg">
          {t('wizard.back')}
        </Button>
        <Button onClick={onNext} size="lg">
          {t('wizard.next')}
        </Button>
      </div>
    </div>
  )
}

function StepPlayers({
  onBack,
  onFinish,
}: {
  onBack: () => void
  onFinish: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <h2 className="serif text-2xl font-semibold">{t('wizard.title.players')}</h2>
      <Card variant="hero" className="bg-court-pattern text-cream text-center p-8">
        <div className="text-5xl mb-3 inline-block" aria-hidden>
          🎾
        </div>
        <p className="serif text-xl font-semibold mb-2">
          {t('wizard.finish')}
        </p>
        <p className="text-sm text-cream/80 max-w-md mx-auto">
          {t('dashboard.empty.description')}
        </p>
      </Card>
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} size="lg">
          {t('wizard.back')}
        </Button>
        <Button onClick={onFinish} size="lg">
          {t('wizard.finish')}
        </Button>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-fg mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parsePositiveInt(e.target.value, value))}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 tabular focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none"
      />
    </div>
  )
}

function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (b: boolean) => void
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
      />
      <span className="min-w-0">
        <span className="text-sm text-fg block">{label}</span>
        {hint && <span className="text-xs text-fg-muted block mt-0.5">{hint}</span>}
      </span>
    </label>
  )
}
