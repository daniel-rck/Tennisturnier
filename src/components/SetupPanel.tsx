import type { EntryFormat, Format, Mode } from '../types'
import {
  ENTRY_FORMAT_KEYS,
  FORMAT_KEYS,
  MODE_KEYS,
} from '../types'
import { parsePositiveInt } from '../utils/parseScore'
import { useConfirm } from '../hooks/useConfirm'
import { useTranslation, type TranslationKey } from '../i18n'

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
  onReset: () => void
  onExport: () => void
  onImport: (f: File) => void
}

const FORMAT_HINT_KEYS: Record<Format, TranslationKey> = {
  rotation: 'setup.formatHint.rotation',
  groups: 'setup.formatHint.groups',
  knockout: 'setup.formatHint.knockout',
  'groups-ko': 'setup.formatHint.groups-ko',
}

export function SetupPanel({
  name,
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
  onName,
  onFormat,
  onEntryFormat,
  onCourts,
  onRounds,
  onMode,
  onAllowPartialFinalRound,
  onGroupCount,
  onAdvancePerGroup,
  onThirdPlaceMatch,
  onPerGenderRanking,
  onReset,
  onExport,
  onImport,
}: Props) {
  const confirm = useConfirm()
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-fg mb-1">
          {t('setup.tournamentName')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          className="w-full rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-fg mb-2">
          {t('setup.format')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(FORMAT_KEYS) as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormat(f)}
              className={
                'rounded-md border px-3 py-2 text-sm transition text-left ' +
                (format === f
                  ? 'border-brand bg-brand-soft text-brand-soft-fg font-medium'
                  : 'border-border-strong hover:border-brand-hover')
              }
            >
              {t(FORMAT_KEYS[f])}
            </button>
          ))}
        </div>
        <p className="text-xs text-fg-muted mt-1">
          {t(FORMAT_HINT_KEYS[format])}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-fg mb-1">
            {t('setup.courts')}
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={courts}
            onChange={(e) => onCourts(parsePositiveInt(e.target.value, courts))}
            className="w-full rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          />
        </div>

        {format === 'rotation' && (
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              {t('setup.rounds')}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={rounds}
              onChange={(e) => onRounds(parsePositiveInt(e.target.value, rounds))}
              className="w-full rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        )}
      </div>

      {format === 'rotation' && (
        <div>
          <label className="block text-sm font-medium text-fg mb-2">
            {t('setup.doublesMode')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(MODE_KEYS) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMode(m)}
                className={
                  'rounded-md border px-3 py-2 text-sm transition ' +
                  (mode === m
                    ? 'border-brand bg-brand-soft text-brand-soft-fg font-medium'
                    : 'border-border-strong hover:border-brand-hover')
                }
              >
                {t(MODE_KEYS[m])}
              </button>
            ))}
          </div>
        </div>
      )}

      {format === 'rotation' && (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowPartialFinalRound}
              onChange={(e) => onAllowPartialFinalRound(e.target.checked)}
              className="rounded border-border-strong text-brand focus:ring-brand"
            />
            {t('setup.partialFinal')}
          </label>
          <p className="text-xs text-fg-muted mt-1 ml-6">
            {t('setup.partialFinalHint')}
          </p>
        </div>
      )}

      {format === 'rotation' && mode === 'mixed' && (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={perGenderRanking}
              onChange={(e) => onPerGenderRanking(e.target.checked)}
              className="rounded border-border-strong text-brand focus:ring-brand"
            />
            {t('setup.perGenderRanking')}
          </label>
          <p className="text-xs text-fg-muted mt-1 ml-6">
            {t('setup.perGenderRankingHint')}
          </p>
        </div>
      )}

      {(format === 'groups' || format === 'knockout' || format === 'groups-ko') && (
        <div>
          <label className="block text-sm font-medium text-fg mb-2">
            {t('setup.entryFormat')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ENTRY_FORMAT_KEYS) as EntryFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onEntryFormat(f)}
                className={
                  'rounded-md border px-3 py-2 text-sm transition ' +
                  (entryFormat === f
                    ? 'border-brand bg-brand-soft text-brand-soft-fg font-medium'
                    : 'border-border-strong hover:border-brand-hover')
                }
              >
                {t(ENTRY_FORMAT_KEYS[f])}
              </button>
            ))}
          </div>
        </div>
      )}

      {(format === 'groups' || format === 'groups-ko') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              {t('setup.groupCount')}
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={groupCount}
              onChange={(e) =>
                onGroupCount(parsePositiveInt(e.target.value, groupCount))
              }
              className="w-full rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
          {format === 'groups-ko' && (
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                {t('setup.advancePerGroup')}
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={advancePerGroup}
                onChange={(e) =>
                  onAdvancePerGroup(
                    parsePositiveInt(e.target.value, advancePerGroup),
                  )
                }
                className="w-full rounded-md border border-border-strong px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
            </div>
          )}
        </div>
      )}

      {(format === 'knockout' || format === 'groups-ko') && (
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={thirdPlaceMatch}
              onChange={(e) => onThirdPlaceMatch(e.target.checked)}
              className="rounded border-border-strong text-brand focus:ring-brand"
            />
            {t('setup.thirdPlace')}
          </label>
          <p className="text-xs text-fg-muted mt-1 ml-6">
            {t('setup.thirdPlaceHint')}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="rounded border border-border-strong px-3 py-1.5 text-sm hover:border-brand-hover"
          >
            {t('setup.exportJson')}
          </button>
          <label className="rounded border border-border-strong px-3 py-1.5 text-sm hover:border-brand-hover cursor-pointer">
            {t('setup.import')}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: t('setup.resetConfirm.title'),
              description: t('setup.resetConfirm.description'),
              confirmLabel: t('setup.resetConfirm.button'),
              destructive: true,
            })
            if (ok) onReset()
          }}
          className="text-sm text-danger-fg hover:opacity-80 underline"
        >
          {t('setup.reset')}
        </button>
      </div>
    </div>
  )
}
