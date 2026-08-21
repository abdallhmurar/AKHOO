import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import type { HelpRequest } from '@/types'

export function RequestTimeline({ request }: { request: HelpRequest }) {
  const { t, i18n } = useTranslation()

  const steps: { key: string; at: string | null }[] = [
    { key: 'createdAt', at: request.created_at },
    { key: 'acceptedAt', at: request.accepted_at },
    { key: 'awaitingConfirmationAt', at: request.awaiting_confirmation_at },
    { key: 'completedAt', at: request.completed_at },
    { key: 'confirmationRejectedAt', at: request.confirmation_rejected_at }
  ].filter(step => step.at !== null)

  if (steps.length === 0) return null

  return (
    <ol className="flex flex-col gap-4">
      {steps.map(step => (
        <li key={step.key} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{t(`requests.detail.${step.key}`)}</p>
            <p className="text-xs text-muted-foreground">{new Date(step.at!).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
