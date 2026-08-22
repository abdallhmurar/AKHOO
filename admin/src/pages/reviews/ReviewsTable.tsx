import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeOff, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { BooleanBadge } from '@/components/StatusBadge'
import { StarRating } from '@/components/StarRating'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useSetReviewHidden } from './useSetReviewHidden'
import type { ReviewRow } from './useReviews'

function ModerateAction({ review }: { review: ReviewRow }) {
  const { t } = useTranslation()
  const setHidden = useSetReviewHidden()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setOpen(true) }}>
        {review.is_hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        {review.is_hidden ? t('reviews.restore') : t('reviews.hide')}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={review.is_hidden ? t('reviews.restoreConfirmTitle') : t('reviews.hideConfirmTitle')}
        description={review.is_hidden ? t('reviews.restoreConfirmMessage') : t('reviews.hideConfirmMessage')}
        confirmLabel={review.is_hidden ? t('reviews.restore') : t('reviews.hide')}
        destructive={!review.is_hidden}
        onConfirm={() => setHidden.mutateAsync({ id: review.id, hidden: !review.is_hidden })}
      />
    </>
  )
}

export function ReviewsTable({ rows, isLoading, isError }: { rows: ReviewRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<ReviewRow>[] = [
    { key: 'business', header: t('offers.table.business'), cell: row => row.business_name || t('common.unknown') },
    { key: 'user', header: t('reviews.table.user'), cell: row => row.reviewer_name || t('common.unknown') },
    { key: 'rating', header: t('reviews.table.rating'), cell: row => <StarRating rating={row.rating} size="sm" /> },
    { key: 'comment', header: t('reviews.table.comment'), cell: row => <span className="line-clamp-1 max-w-xs">{row.comment || '—'}</span> },
    { key: 'date', header: t('points.table.date'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) },
    { key: 'visibility', header: t('reviews.table.visibility'), cell: row => <BooleanBadge value={!row.is_hidden} trueLabel={t('reviews.table.visible')} falseLabel={t('reviews.table.hidden')} /> },
    { key: 'actions', header: '', cell: row => <ModerateAction review={row} /> }
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      getRowId={row => row.id}
      onRowClick={row => navigate(`/businesses/${row.business_id}`)}
    />
  )
}
