import { useEffect, useState } from 'react'
import type { Tournament } from '../types'
import type { SyncRole, SyncStatus } from '../hooks/useSync'
import { Spinner } from './Spinner'
import { useToast } from '../hooks/useToast'
import { useTranslation, type TranslationKey } from '../i18n'

interface Props {
  tournament: Tournament
  status: SyncStatus
  role: SyncRole
  error: string | null
  onCreate: () => Promise<string>
  onJoin: (code: string) => Promise<void>
  onLeave: () => void
}

export function SyncPanel({
  tournament,
  status,
  role,
  error,
  onCreate,
  onJoin,
  onLeave,
}: Props) {
  const { t } = useTranslation()
  const sync = tournament.sync
  const [busy, setBusy] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const copyCode = async () => {
    if (!sync?.shareCode) return
    try {
      await navigator.clipboard?.writeText(sync.shareCode)
      toast({ variant: 'success', title: t('sync.codeCopied') })
    } catch {
      toast({
        variant: 'error',
        title: t('sync.copyFailed'),
        description: t('sync.copyFailedDesc'),
      })
    }
  }

  const copyToken = async () => {
    if (!sync?.ownerToken) return
    try {
      await navigator.clipboard?.writeText(sync.ownerToken)
      toast({ variant: 'success', title: t('sync.tokenCopied') })
    } catch {
      toast({
        variant: 'error',
        title: t('sync.copyFailed'),
        description: t('sync.copyFailedDesc'),
      })
    }
  }

  useEffect(() => {
    if (!sync || role !== 'owner') {
      setQrDataUrl(null)
      return
    }
    const url = `${window.location.origin}${window.location.pathname}?join=${sync.shareCode}`
    const isLargeViewport =
      typeof window !== 'undefined' && window.innerWidth >= 1536
    let active = true
    // Lazy-load the qrcode lib so it stays out of the initial bundle — only
    // the owner device ever renders a QR code.
    void import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(url, { width: isLargeViewport ? 360 : 220, margin: 1 }),
      )
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl)
      })
      .catch(() => {
        if (active) setQrDataUrl(null)
      })
    return () => {
      active = false
    }
  }, [sync, role])

  const handleCreate = async () => {
    setBusy(true)
    try {
      await onCreate()
    } catch {
      // status surfaces error
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    try {
      await onJoin(joinCode)
      setJoinCode('')
    } catch {
      // status surfaces error
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('sync.heading')}</h2>
        <StatusBadge status={status} />
      </div>

      {role === 'none' && (
        <div className="space-y-3 text-sm">
          <p className="text-fg-muted">{t('sync.intro')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm text-white font-medium hover:bg-brand-hover disabled:opacity-50"
            >
              {busy && <Spinner />}
              {busy ? t('sync.starting') : t('sync.start')}
            </button>
          </div>
          <div className="pt-2 border-t border-border">
            <label className="block text-xs text-fg-muted mb-1">
              {t('sync.joinLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t('sync.joinPlaceholder')}
                maxLength={6}
                className="flex-1 rounded-md border border-border-strong px-3 py-2 font-mono uppercase tracking-widest"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy || joinCode.length !== 6}
                className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3 py-1.5 text-sm hover:border-brand-hover disabled:opacity-50"
              >
                {busy && <Spinner />}
                {busy ? t('sync.connecting') : t('sync.connect')}
              </button>
            </div>
          </div>
        </div>
      )}

      {role === 'owner' && sync && (
        <div className="space-y-3">
          <p className="text-xs text-fg-muted">{t('sync.ownerHint')}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="font-mono text-3xl 2xl:text-6xl font-bold tracking-widest bg-brand-soft border border-brand-soft rounded px-4 py-2 2xl:px-8 2xl:py-4">
              {sync.shareCode}
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="text-xs text-fg-muted hover:text-fg underline min-h-[36px]"
            >
              {t('sync.copyCode')}
            </button>
          </div>
          {qrDataUrl && (
            <div className="flex items-start gap-3">
              <img
                src={qrDataUrl}
                alt={t('sync.qrAlt')}
                className="rounded border border-border bg-surface"
              />
              <p className="text-xs text-fg-muted">{t('sync.qrHint')}</p>
            </div>
          )}
          <details className="text-xs text-fg-muted">
            <summary className="cursor-pointer hover:text-fg">
              {t('sync.ownerToken')}
            </summary>
            <p className="mt-1">{t('sync.ownerTokenHint')}</p>
            <div className="mt-1 flex items-center gap-2">
              <code
                className="flex-1 break-all bg-surface-muted p-2 rounded text-[10px] text-fg tracking-widest"
                aria-hidden
              >
                {maskToken(sync.ownerToken)}
              </code>
              <button
                type="button"
                onClick={copyToken}
                aria-label={t('sync.copyToken')}
                className="shrink-0 rounded-md border border-border-strong px-2 py-1 text-[11px] hover:border-brand-hover"
              >
                {t('sync.copyToken')}
              </button>
            </div>
          </details>
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-danger-fg hover:text-danger-fg underline"
          >
            {t('sync.leave')}
          </button>
        </div>
      )}

      {role === 'viewer' && sync && (
        <div className="space-y-2 text-sm">
          <p>
            {t('sync.viewerConnected', { code: sync.shareCode })}
          </p>
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-fg-muted hover:text-fg underline"
          >
            {t('sync.disconnect')}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger-fg bg-danger-bg border border-danger-fg/30 rounded px-2 py-1">
          {error}
        </p>
      )}
    </section>
  )
}

/** Show only the first 4 chars of the owner token; mask the rest so a casual
 *  screenshot or screen-share doesn't leak write access. Full value stays
 *  available via the copy button. */
function maskToken(token?: string): string {
  if (!token) return ''
  const head = token.slice(0, 4)
  return `${head}${'•'.repeat(Math.max(8, token.length - 4))}`
}

const STATUS_KEYS: Record<SyncStatus, TranslationKey> = {
  disabled: 'sync.status.disabled',
  connecting: 'sync.status.connecting',
  live: 'sync.status.live',
  offline: 'sync.status.offline',
  error: 'sync.status.error',
}

const STATUS_CLASSES: Record<SyncStatus, string> = {
  disabled: 'bg-surface-sunken text-fg-muted',
  connecting: 'bg-warn-bg text-warn-fg animate-pulse',
  live: 'bg-brand-soft text-brand-soft-fg',
  offline: 'bg-orange-100 text-orange-800',
  error: 'bg-danger-bg text-danger-fg',
}

function StatusBadge({ status }: { status: SyncStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors duration-300 ${STATUS_CLASSES[status]}`}
    >
      ● {t(STATUS_KEYS[status])}
    </span>
  )
}
