import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, RotateCcw, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import { cn } from '@/lib/cn'
import { useIsRTL } from '@/lib/direction'
import { ImageValidationError, validateImageFile } from '@/lib/storage'
import { CustomerCard } from './CustomerCard'
import { SupportStatusBadge } from './SupportStatusBadge'
import { formatStamp } from './format'
import { useSetSupportStatus, useSupportMessages, useSupportReply, type ConversationRow, type MessageRow } from './useSupport'

function Bubble({ message }: { message: MessageRow }) {
  const { i18n, t } = useTranslation()
  const mine = message.from_admin
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[78%] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5 shadow-sm', mine ? 'bg-teal text-white' : 'border border-border bg-card text-foreground')}>
        {message.media_url ? (
          <a href={message.media_url} target="_blank" rel="noreferrer">
            <img src={message.media_url} alt={t('support.photo')} className="max-h-64 rounded-lg object-cover" />
          </a>
        ) : null}
        {message.body ? <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p> : null}
        <p className={cn('text-[11px]', mine ? 'text-white/70' : 'text-muted-foreground')}>{formatStamp(message.created_at, i18n.language)}</p>
      </div>
    </div>
  )
}

export function ChatPane({ conversation, onBack }: { conversation: ConversationRow; onBack: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const messages = useSupportMessages(conversation.id)
  const reply = useSupportReply()
  const setStatus = useSetSupportStatus()
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const messageCount = messages.data?.length ?? 0
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [messageCount, conversation.id])

  useEffect(() => {
    if (!image) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  // A different conversation starts with an empty composer.
  useEffect(() => { setText(''); setImage(null) }, [conversation.id])

  function pickImage(file: File | undefined) {
    if (!file) return
    try {
      validateImageFile(file)
      setImage(file)
    } catch (error) {
      if (error instanceof ImageValidationError) toast.error(t(`businesses.form.imageErrors.${error.message}`))
    }
  }

  const canSend = (text.trim().length > 0 || !!image) && !reply.isPending

  function send() {
    if (!canSend) return
    reply.mutate({ conversation, body: text, image }, { onSuccess: () => { setText(''); setImage(null) } })
  }

  const resolved = conversation.status === 'resolved'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label={t('support.back')}>
          <BackIcon className="size-4" />
        </Button>
        <Avatar className="size-9">
          <AvatarImage src={conversation.avatar_url ?? undefined} />
          <AvatarFallback>{(conversation.name?.trim()?.[0] ?? '?').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-foreground">{conversation.name || t('support.customer.noName')}</p>
          <SupportStatusBadge status={conversation.status} />
        </div>
        {resolved ? (
          <Button variant="outline" size="sm" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ conversationId: conversation.id, status: 'open' })}>
            <RotateCcw className="size-4" />{t('support.reopen')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ conversationId: conversation.id, status: 'resolved' })}>
            <CheckCircle2 className="size-4" />{t('support.markResolved')}
          </Button>
        )}
      </div>

      <details className="border-b border-border bg-card xl:hidden">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-muted-foreground">{t('support.customer.title')}</summary>
        <div className="max-h-80 overflow-y-auto p-3">
          <CustomerCard userId={conversation.user_id} conversationId={conversation.id} className="border-0 p-0" />
        </div>
      </details>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.isPending ? (
          <div className="flex flex-col gap-3"><Skeleton className="h-12 w-2/3" /><Skeleton className="ms-auto h-12 w-1/2" /></div>
        ) : messages.isError ? (
          <ErrorState onRetry={() => messages.refetch()} />
        ) : (
          messages.data.map(message => <Bubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card p-3">
        {previewUrl ? (
          <div className="relative mb-2 inline-block">
            <img src={previewUrl} alt="" className="h-20 rounded-md border border-border object-cover" />
            <button type="button" onClick={() => setImage(null)} aria-label={t('support.reply.removeImage')} className="absolute -end-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
              <X className="size-3" />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { pickImage(e.target.files?.[0]); e.target.value = '' }} />
          <Button variant="ghost" size="icon" type="button" onClick={() => fileRef.current?.click()} disabled={reply.isPending} aria-label={t('support.reply.attach')}>
            <ImagePlus className="size-5" />
          </Button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            rows={2}
            maxLength={4000}
            placeholder={t('support.reply.placeholder')}
            aria-label={t('support.reply.placeholder')}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="button" onClick={send} disabled={!canSend}>
            <Send className={cn('size-4', isRTL && '-scale-x-100')} />
            {reply.isPending ? t('support.reply.sending') : t('support.reply.send')}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">{t('support.reply.hint')}</p>
      </div>
    </div>
  )
}
