import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { BooleanBadge } from '@/components/StatusBadge'
import { ErrorState } from '@/components/ErrorState'
import { useBusinessOptions } from '../offers/useBusinessOptions'
import { usePartnerAccessMutations, useUserPartnerAccess } from './usePartnerAccess'
import type { PartnerRole, PartnerUser } from './partnerAccessRepository'

export function PartnerAccessSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const query = useUserPartnerAccess(userId)
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-semibold text-foreground">{t('partnerAccess.title')}</h2>
        {query.isPending ? <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          : query.isError ? <ErrorState onRetry={() => query.refetch()} />
            : <PartnerAccessForm key={`${userId}:${query.data?.updated_at ?? 'new'}`} userId={userId} access={query.data} />}
      </CardContent>
    </Card>
  )
}

function PartnerAccessForm({ userId, access }: { userId: string; access: PartnerUser | null }) {
  const { t } = useTranslation()
  const businesses = useBusinessOptions()
  const { save, revoke } = usePartnerAccessMutations(userId)
  const [partnerId, setPartnerId] = useState(access?.partner_id ?? '')
  const [role, setRole] = useState<PartnerRole>(access?.role ?? 'owner')
  const [isActive, setIsActive] = useState(access?.is_active ?? true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const busy = save.isPending || revoke.isPending
  const options = [...(businesses.data ?? [])]
  if (access && !options.some(b => b.id === access.partner_id)) {
    options.unshift({ id: access.partner_id, name: access.partner.name })
  }
  const unchanged = !!access && partnerId === access.partner_id && role === access.role && isActive === access.is_active

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({ userId, partnerId, role, isActive })
      toast.success(t('partnerAccess.saved'))
    } catch { /* The mutation displays the server error. */ }
  }

  async function revokeAccess() {
    try {
      await revoke.mutateAsync(userId)
      setConfirmOpen(false)
      toast.success(t('partnerAccess.revoked'))
    } catch { /* Keep the dialog open on failure. */ }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <BooleanBadge value={access?.is_active ?? false} trueLabel={t('partnerAccess.active')} falseLabel={t(access ? 'partnerAccess.inactive' : 'partnerAccess.none')} />
        {access && <span className="text-sm text-muted-foreground">{access.partner.name} · {t(`partnerAccess.roles.${access.role}`)}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{t('partnerAccess.description')}</p>
      {businesses.isError && <ErrorState onRetry={() => businesses.refetch()} />}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="partner-business">{t('partnerAccess.business')}</Label>
            <Select value={partnerId} onValueChange={setPartnerId} disabled={busy || businesses.isPending || businesses.isError}>
              <SelectTrigger id="partner-business"><SelectValue placeholder={t('partnerAccess.selectBusiness')} /></SelectTrigger>
              <SelectContent>{options.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            {businesses.isSuccess && options.length === 0 && <p className="text-xs text-muted-foreground">{t('partnerAccess.noBusinesses')}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="partner-role">{t('partnerAccess.role')}</Label>
            <Select value={role} onValueChange={value => setRole(value as PartnerRole)} disabled={busy}>
              <SelectTrigger id="partner-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{t('partnerAccess.roles.owner')}</SelectItem>
                <SelectItem value="staff">{t('partnerAccess.roles.staff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="partner-active" checked={isActive} onCheckedChange={checked => setIsActive(checked === true)} disabled={busy} />
          <Label htmlFor="partner-active">{t('partnerAccess.enable')}</Label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {access?.is_active && <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmOpen(true)}>{t('partnerAccess.revoke')}</Button>}
          <Button type="submit" disabled={busy || !partnerId || unchanged || !businesses.isSuccess}>{t(access ? 'common.save' : 'partnerAccess.grant')}</Button>
        </div>
      </form>
      <Dialog open={confirmOpen} onOpenChange={open => { if (!busy) setConfirmOpen(open) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('partnerAccess.revoke')}</DialogTitle><DialogDescription>{t('partnerAccess.revokeMessage')}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" disabled={busy} onClick={() => { void revokeAccess() }}>{t('partnerAccess.revoke')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
