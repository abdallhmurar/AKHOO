import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { RequestStatus, OfferStatus, RedemptionStatus, ReportStatus, BusinessStatus } from '@/types'

const STATUS_TONE: Record<RequestStatus, string> = {
  open: 'bg-sanad-infoSoft text-sanad-info border-transparent',
  accepted: 'bg-sanad-sandSoft text-sanad-forestPressed border-transparent',
  on_the_way: 'bg-sanad-sandSoft text-sanad-forestPressed border-transparent',
  arrived: 'bg-sanad-sandSoft text-sanad-forestPressed border-transparent',
  awaiting_confirmation: 'bg-sanad-warningSoft text-sanad-warning border-transparent',
  completed: 'bg-sanad-successSoft text-sanad-success border-transparent',
  cancelled: 'bg-sanad-dangerSoft text-sanad-danger border-transparent'
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(STATUS_TONE[status])}>{t(`requests.status.${status}`)}</Badge>
}

const OFFER_STATUS_TONE: Record<OfferStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground border-transparent',
  pending_review: 'bg-sanad-warningSoft text-sanad-warning border-transparent',
  approved: 'bg-sanad-successSoft text-sanad-success border-transparent',
  rejected: 'bg-sanad-dangerSoft text-sanad-danger border-transparent',
  paused: 'bg-sanad-sandSoft text-sanad-forestPressed border-transparent',
  expired: 'bg-secondary text-muted-foreground border-transparent'
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(OFFER_STATUS_TONE[status])}>{t(`offers.status.${status}`)}</Badge>
}

const REDEMPTION_STATUS_TONE: Record<RedemptionStatus, string> = {
  pending: 'bg-sanad-warningSoft text-sanad-warning border-transparent',
  redeemed: 'bg-sanad-successSoft text-sanad-success border-transparent',
  expired: 'bg-secondary text-muted-foreground border-transparent',
  cancelled: 'bg-secondary text-muted-foreground border-transparent',
  refunded: 'bg-sanad-dangerSoft text-sanad-danger border-transparent'
}

export function RedemptionStatusBadge({ status }: { status: RedemptionStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(REDEMPTION_STATUS_TONE[status])}>{t(`redemptions.status.${status}`)}</Badge>
}

const REPORT_STATUS_TONE: Record<ReportStatus, string> = {
  open: 'bg-sanad-dangerSoft text-sanad-danger border-transparent',
  reviewing: 'bg-sanad-warningSoft text-sanad-warning border-transparent',
  resolved: 'bg-sanad-successSoft text-sanad-success border-transparent',
  dismissed: 'bg-secondary text-muted-foreground border-transparent'
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(REPORT_STATUS_TONE[status])}>{t(`reports.status.${status}`)}</Badge>
}

const BUSINESS_STATUS_TONE: Record<BusinessStatus, string> = {
  pending: 'bg-sanad-warningSoft text-sanad-warning border-transparent',
  verified: 'bg-sanad-successSoft text-sanad-success border-transparent',
  suspended: 'bg-sanad-dangerSoft text-sanad-danger border-transparent',
  rejected: 'bg-secondary text-muted-foreground border-transparent'
}

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(BUSINESS_STATUS_TONE[status])}>{t(`businesses.status.${status}`)}</Badge>
}

export function BooleanBadge({ value, trueLabel, falseLabel, invertTone = false }: { value: boolean; trueLabel: string; falseLabel: string; invertTone?: boolean }) {
  const positiveTone = invertTone ? 'bg-sanad-dangerSoft text-sanad-danger border-transparent' : 'bg-sanad-successSoft text-sanad-success border-transparent'
  const negativeTone = 'bg-secondary text-secondary-foreground border-transparent'
  return <Badge className={cn(value ? positiveTone : negativeTone)}>{value ? trueLabel : falseLabel}</Badge>
}
