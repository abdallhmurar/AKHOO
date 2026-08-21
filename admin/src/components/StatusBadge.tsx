import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { RequestStatus } from '@/types'

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

export function BooleanBadge({ value, trueLabel, falseLabel, invertTone = false }: { value: boolean; trueLabel: string; falseLabel: string; invertTone?: boolean }) {
  const positiveTone = invertTone ? 'bg-sanad-dangerSoft text-sanad-danger border-transparent' : 'bg-sanad-successSoft text-sanad-success border-transparent'
  const negativeTone = 'bg-secondary text-secondary-foreground border-transparent'
  return <Badge className={cn(value ? positiveTone : negativeTone)}>{value ? trueLabel : falseLabel}</Badge>
}
