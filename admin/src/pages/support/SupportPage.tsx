import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessagesSquare } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { cn } from '@/lib/cn'
import { ChatPane } from './ChatPane'
import { ConversationList } from './ConversationList'
import { CustomerCard } from './CustomerCard'
import { useSupportConversations, useSupportRealtime } from './useSupport'

// Support inbox: conversations on one side, the chat in the middle and the
// customer's CRM card + internal notes on the other (folded into the chat
// header below the xl breakpoint). Below lg it is one pane at a time.
export function SupportPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const conversations = useSupportConversations()
  useSupportRealtime()

  if (conversations.isError) return <ErrorState onRetry={() => conversations.refetch()} />

  const rows = conversations.data ?? []
  const selected = rows.find(row => row.id === id) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('support.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('support.subtitle')}</p>
      </div>

      <div className="grid h-[calc(100vh-12rem)] min-h-[520px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <div className={cn('min-h-0', selected && 'hidden lg:block')}>
          <ConversationList rows={rows} loading={conversations.isPending} selectedId={selected?.id} onSelect={next => navigate(`/support/${next}`)} />
        </div>

        <div className={cn('min-h-0', !selected && 'hidden lg:block')}>
          {selected ? (
            <ChatPane conversation={selected} onBack={() => navigate('/support')} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-card">
              <EmptyState icon={MessagesSquare} message={t('support.selectPrompt')} />
            </div>
          )}
        </div>

        {selected ? (
          <div className="hidden min-h-0 xl:block">
            <CustomerCard userId={selected.user_id} conversationId={selected.id} className="h-full" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
