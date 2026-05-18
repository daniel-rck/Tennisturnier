import type { Tournament } from '../types'
import type { SyncRole, SyncStatus } from '../hooks/useSync'
import { useTranslation } from '../i18n'
import { Sheet, Button } from './ui'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'
import { SyncPanel } from './SyncPanel'
import { PrivacyDialog } from './PrivacyDialog'
import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  tournament: Tournament
  isOwner: boolean
  syncStatus: SyncStatus
  syncRole: SyncRole
  syncError: string | null
  onSyncCreate: () => Promise<string>
  onSyncJoin: (code: string) => Promise<void>
  onSyncLeave: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export function SettingsSheet({
  open,
  onClose,
  tournament,
  isOwner,
  syncStatus,
  syncRole,
  syncError,
  onSyncCreate,
  onSyncJoin,
  onSyncLeave,
  onExport,
  onImport,
}: Props) {
  const { t } = useTranslation()
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onClose={onClose} title={t('settings.title')}>
        <div className="space-y-6">
          <Section title={t('settings.appearance')}>
            <Row label={t('settings.appearance.theme')}>
              <ThemeToggle />
            </Row>
            <Row label={t('settings.appearance.language')}>
              <LocaleToggle />
            </Row>
          </Section>

          <Section title={t('settings.sync')}>
            <SyncPanel
              tournament={tournament}
              status={syncStatus}
              role={syncRole}
              error={syncError}
              onCreate={onSyncCreate}
              onJoin={onSyncJoin}
              onLeave={onSyncLeave}
            />
          </Section>

          {isOwner && (
            <Section title={t('settings.data')}>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={onExport}>
                  {t('settings.export')}
                </Button>
                <label className="inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-fg min-h-[36px] hover:border-brand-hover hover:bg-surface-muted transition-colors cursor-pointer">
                  {t('settings.import')}
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        onImport(f)
                        onClose()
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </Section>
          )}

          <Section title={t('settings.about')}>
            <div className="text-sm text-fg-muted space-y-1">
              <div className="tabular">
                {t('settings.aboutVersion', { version: __APP_VERSION__ })} ·{' '}
                {__BUILD_DATE__}
              </div>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="underline hover:text-fg"
              >
                {t('app.privacyLink')}
              </button>
            </div>
          </Section>
        </div>
      </Sheet>
      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  )
}
