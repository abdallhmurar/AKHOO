import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BooleanBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/cn'
import { useUserDetail } from '@/pages/users/useUserDetail'
import { useUserPoints } from '@/pages/users/useUserPoints'
import { formatStamp } from './format'
import { useAddSupportNote, useSupportNotes } from './useSupport'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-secondary/60 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

// The CRM side of the inbox: who this is, how they use AKHOO, and the
// internal notes that only admins can read.
export function CustomerCard({ userId, conversationId, className }: { userId: string; conversationId: string; className?: string }) {
  const { t, i18n } = useTranslation()
  const detail = useUserDetail(userId)
  const points = useUserPoints(userId)
  const notes = useSupportNotes(conversationId)
  const addNote = useAddSupportNote()
  const [draft, setDraft] = useState('')

  const profile = detail.data?.profile

  function submitNote() {
    const body = draft.trim()
    if (!body || addNote.isPending) return
    addNote.mutate({ conversationId, body }, { onSuccess: () => setDraft('') })
  }

  return (
    <div className={cn('flex flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-4', className)}>
      {detail.isPending ? (
        <div className="flex flex-col gap-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : profile ? (
        <>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback>{(profile.full_name?.trim()?.[0] ?? '?').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-foreground">{profile.full_name || t('support.customer.noName')}</p>
              <p className="truncate text-xs text-muted-foreground" dir="ltr">{profile.phone || t('users.table.noPhone')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <BooleanBadge value={profile.is_banned} trueLabel={t('users.table.banned')} falseLabel={t('users.table.active')} invertTone />
            {detail.data?.volunteerProfile ? (
              <Badge variant="secondary">{detail.data.volunteerProfile.is_verified ? t('support.customer.verifiedVolunteer') : t('support.customer.volunteer')}</Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('support.customer.points')} value={points.data?.balance ?? '—'} />
            <Stat label={t('support.customer.joined')} value={new Date(profile.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })} />
            <Stat label={t('support.customer.requests')} value={detail.data?.requests.length ?? 0} />
            <Stat label={t('support.customer.missionsCompleted')} value={detail.data?.completedCount ?? 0} />
          </div>

          <Button asChild variant="outline" size="sm">
            <Link to={`/users/${userId}`}><ExternalLink className="size-4" />{t('support.customer.openProfile')}</Link>
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t('support.customer.unavailable')}</p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm font-bold text-foreground">{t('support.notes.title')}</p>
        <p className="text-xs text-muted-foreground">{t('support.notes.hint')}</p>
        {notes.data && notes.data.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {notes.data.map(note => (
              <li key={note.id} className="rounded-md bg-sanad-warningSoft/60 px-3 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">{note.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatStamp(note.created_at, i18n.language)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t('support.notes.empty')}</p>
        )}
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t('support.notes.placeholder')}
          aria-label={t('support.notes.placeholder')}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button size="sm" variant="outline" disabled={!draft.trim() || addNote.isPending} onClick={submitNote}>{t('support.notes.add')}</Button>
      </div>
    </div>
  )
}
