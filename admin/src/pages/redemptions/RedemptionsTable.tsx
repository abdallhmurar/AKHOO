import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2, Ban } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { RedemptionStatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useCancelRedemption } from './useCancelRedemption'
import { useRefundRedemption } from './useRefundRedemption'
import type { RedemptionRow } from './useRedemptions'

function RowActions({ row }: { row: RedemptionRow }) {
  const { t } = useTranslation()
  const cancel = useCancelRedemption()
  const refund = useRefundRedemption()
  const [confirming, setConfirming] = useState<'cancel' | 'refund' | null>(null)

  if (row.status === 'pending') {
    return (
      <>
        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setConfirming('cancel') }}>
          <Ban className="size-4" />
          {t('redemptions.cancel')}
        </Button>
        <ConfirmDialog
          open={confirming === 'cancel'}
          onOpenChange={open => !open && setConfirming(null)}
          title={t('redemptions.cancelConfirmTitle')}
          description={t('redemptions.cancelConfirmMessage')}
          confirmLabel={t('redemptions.cancel')}
          destructive
          onConfirm={() => cancel.mutateAsync(row.id)}
        />
      </>
    )
  }

  if (row.status === 'redeemed') {
    return (
      <>
        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setConfirming('refund') }}>
          <Undo2 className="size-4" />
          {t('redemptions.refund')}
        </Button>
        <ConfirmDialog
          open={confirming === 'refund'}
          onOpenChange={open => !open && setConfirming(null)}
          title={t('redemptions.refundConfirmTitle')}
          description={t('redemptions.refundConfirmMessage')}
          confirmLabel={t('redemptions.refund')}
          destructive
          onConfirm={() => refund.mutateAsync(row.id)}
        />
      </>
    )
  }

  return null
}

export function RedemptionsTable({ rows, isLoading, isError }: { rows: RedemptionRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()

  const columns: Column<RedemptionRow>[] = [
    { key: 'code', header: t('redemptions.table.code'), cell: row => <span className="font-mono text-xs" dir="ltr">{row.code.slice(0, 12)}…</span> },
    { key: 'offer', header: t('redemptions.table.offer'), cell: row => row.offer_title || t('common.unknown') },
    { key: 'user', header: t('redemptions.table.user'), cell: row => row.user_name || t('common.unknown') },
    { key: 'partner', header: t('redemptions.table.partner'), cell: row => row.partner_name || t('offers.form.noBusiness') },
    { key: 'points', header: t('redemptions.table.points'), cell: row => <span dir="ltr">{row.points_spent}</span> },
    { key: 'status', header: t('redemptions.table.status'), cell: row => <RedemptionStatusBadge status={row.status} /> },
    { key: 'expires', header: t('redemptions.table.expires'), cell: row => new Date(row.expires_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) },
    { key: 'actions', header: '', cell: row => <RowActions row={row} /> }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} />
}
