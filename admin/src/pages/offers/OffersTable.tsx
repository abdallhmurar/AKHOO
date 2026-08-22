import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { OfferStatusBadge } from '@/components/StatusBadge'
import { effectiveOfferStatus } from '@/lib/offerStatus'
import type { OfferRow } from './useOffers'

export function OffersTable({ rows, isLoading, isError }: { rows: OfferRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<OfferRow>[] = [
    { key: 'title', header: t('offers.table.title'), cell: row => row.title },
    { key: 'business', header: t('offers.table.business'), cell: row => row.business_name || t('common.unknown') },
    { key: 'price', header: t('offers.form.sections.pricing'), cell: row => (row.original_price != null && row.offer_price != null ? <span dir="ltr">{row.offer_price} / {row.original_price}</span> : row.discount_type === 'percentage' && row.discount_value ? `${row.discount_value}%` : '—') },
    { key: 'status', header: t('offers.table.status'), cell: row => <OfferStatusBadge status={effectiveOfferStatus(row.status, row.valid_until)} /> },
    { key: 'validUntil', header: t('common.dateTo'), cell: row => (row.valid_until ? new Date(row.valid_until).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) : '—') }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/offers/${row.id}`)} />
}
