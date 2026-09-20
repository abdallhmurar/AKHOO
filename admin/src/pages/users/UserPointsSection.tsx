import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Award, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { RedemptionStatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/cn'
import { useAdjustPoints, useUserPoints } from './useUserPoints'
import type { PointsEntry } from './useUserPoints'

// Mirrors the limit enforced in admin_adjust_points (0032).
const MAX_POINTS = 100_000
const MAX_REASON = 200

function signed(points: number) {
  return points > 0 ? `+${points}` : `${points}`
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="flex text-lg font-bold text-foreground">
        <span dir="ltr">{value === 0 ? 0 : signed(value)}</span>
      </p>
    </div>
  )
}

function EntryRow({ entry }: { entry: PointsEntry }) {
  const { t, i18n } = useTranslation()
  const muted = entry.kind === 'redemption' && !entry.counts

  const label =
    entry.kind === 'mission'
      ? t('users.detail.points.kinds.mission')
      : entry.kind === 'adjustment'
        ? t(entry.points > 0 ? 'users.detail.points.kinds.adjustmentAdd' : 'users.detail.points.kinds.adjustmentRemove')
        : t('users.detail.points.kinds.redemption', { title: entry.offerTitle ?? t('common.unknown') })

  return (
    <li className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          {label}
          {entry.kind === 'redemption' ? <RedemptionStatusBadge status={entry.status} /> : null}
        </p>
        {entry.kind === 'adjustment' ? <p className="text-xs text-muted-foreground">{entry.reason}</p> : null}
        <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
      <span
        dir="ltr"
        className={cn('shrink-0 text-sm font-bold', entry.points > 0 ? 'text-sanad-success' : 'text-sanad-danger', muted && 'text-muted-foreground line-through')}
      >
        {signed(entry.points)}
      </span>
    </li>
  )
}

export function UserPointsSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const query = useUserPoints(userId)
  const adjust = useAdjustPoints()
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (query.isPending) return <Skeleton className="h-64 w-full" />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const { balance, earned, adjusted, spent, entries } = query.data
  const points = Number(amount)
  const validAmount = Number.isInteger(points) && points >= 1 && points <= MAX_POINTS
  const exceeds = mode === 'remove' && validAmount && points > balance
  const canSubmit = validAmount && reason.trim().length >= 1 && !exceeds && !adjust.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) setConfirmOpen(true)
  }

  async function handleConfirm() {
    const newBalance = await adjust.mutateAsync({ userId, points: mode === 'add' ? points : -points, reason: reason.trim() })
    toast.success(t('users.detail.points.success', { balance: newBalance }))
    setAmount('')
    setReason('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-pressed">
              <Award className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('users.detail.points.balance')}</p>
              <p className="flex text-3xl font-extrabold text-foreground">
                <span dir="ltr">{balance}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
            <Stat label={t('users.detail.points.earned')} value={earned} />
            <Stat label={t('users.detail.points.adjustments')} value={adjusted} />
            <Stat label={t('users.detail.points.spent')} value={-spent} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t('users.detail.points.adjustTitle')}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={mode === 'add' ? 'default' : 'outline'} onClick={() => setMode('add')}>
                <Plus className="size-4" />
                {t('users.detail.points.add')}
              </Button>
              <Button type="button" size="sm" variant={mode === 'remove' ? 'destructive' : 'outline'} onClick={() => setMode('remove')}>
                <Minus className="size-4" />
                {t('users.detail.points.remove')}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="points-amount">{t('users.detail.points.amount')}</Label>
                <Input id="points-amount" type="number" inputMode="numeric" min={1} max={MAX_POINTS} step={1} dir="ltr" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="points-reason">{t('users.detail.points.reason')}</Label>
                <Input id="points-reason" maxLength={MAX_REASON} value={reason} onChange={e => setReason(e.target.value)} placeholder={t('users.detail.points.reasonPlaceholder')} />
              </div>
            </div>
            {exceeds ? <p className="text-xs text-destructive">{t('users.detail.points.removeExceeds', { balance })}</p> : null}
            <div>
              <Button type="submit" variant={mode === 'remove' ? 'destructive' : 'default'} disabled={!canSubmit}>
                {t('users.detail.points.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t(mode === 'add' ? 'users.detail.points.confirmAddTitle' : 'users.detail.points.confirmRemoveTitle', { points })}
        description={t('users.detail.points.confirmMessage')}
        confirmLabel={t('users.detail.points.submit')}
        destructive={mode === 'remove'}
        onConfirm={handleConfirm}
      />

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-1 text-sm font-semibold text-foreground">{t('users.detail.points.history')}</h2>
          {entries.length === 0 ? (
            <EmptyState message={t('users.detail.points.empty')} />
          ) : (
            <ul className="flex flex-col">
              {entries.map(entry => (
                <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
