import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useRedemptions } from './useRedemptions'
import type { RedemptionFilters } from './useRedemptions'
import { useRedeemCode } from './useRedeemCode'
import { RedemptionsTable } from './RedemptionsTable'

const DEFAULT_FILTERS: RedemptionFilters = { status: 'all', search: '' }

function RedeemCodeCard() {
  const { t } = useTranslation()
  const redeem = useRedeemCode()
  const [code, setCode] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!code.trim()) return
    try {
      await redeem.mutateAsync(code)
      toast.success(t('redemptions.redeemCard.success'))
      setCode('')
    } catch {
      // useRedeemCode's onError already toasts the message
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <QrCode className="size-4 text-teal" />
          <h2 className="text-sm font-semibold text-foreground">{t('redemptions.redeemCard.title')}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t('redemptions.redeemCard.subtitle')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input value={code} onChange={e => setCode(e.target.value)} placeholder={t('redemptions.redeemCard.placeholder')} className="font-mono" dir="ltr" />
          <Button type="submit" disabled={redeem.isPending || !code.trim()}>
            {t('redemptions.redeemCard.action')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function RedemptionsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<RedemptionFilters>(DEFAULT_FILTERS)
  const query = useRedemptions(page, filters)

  function handleChange(next: RedemptionFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('redemptions.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('redemptions.subtitle')}</p>
      </div>

      <RedeemCodeCard />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.search} onChange={e => handleChange({ ...filters, search: e.target.value })} placeholder={t('redemptions.filters.searchPlaceholder')} className="ps-9" />
        </div>
        <Select value={filters.status} onValueChange={v => handleChange({ ...filters, status: v as RedemptionFilters['status'] })}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('redemptions.status.pending')}</SelectItem>
            <SelectItem value="redeemed">{t('redemptions.status.redeemed')}</SelectItem>
            <SelectItem value="expired">{t('redemptions.status.expired')}</SelectItem>
            <SelectItem value="cancelled">{t('redemptions.status.cancelled')}</SelectItem>
            <SelectItem value="refunded">{t('redemptions.status.refunded')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <RedemptionsTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
