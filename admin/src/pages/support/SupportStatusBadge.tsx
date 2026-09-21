import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { SupportStatus } from '@/types'

const TONE: Record<SupportStatus, string> = {
  open: 'bg-sanad-dangerSoft text-sanad-danger border-transparent',
  waiting_user: 'bg-sanad-infoSoft text-sanad-info border-transparent',
  resolved: 'bg-sanad-successSoft text-sanad-success border-transparent'
}

export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  const { t } = useTranslation()
  return <Badge className={cn(TONE[status])}>{t(`support.status.${status}`)}</Badge>
}
