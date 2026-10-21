import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types'

type WebsitePartner = {
  business_id: string
  enabled: boolean
  sort_order: number
  show_name: boolean
  name_ar: string
  name_en: string
  name_he: string
}

export function WebsitePartnerCard({ business }: { business: Business }) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['website-partner', business.id],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('website_partners').select('*').eq('business_id', business.id).maybeSingle()
      if (error) throw error
      return data as WebsitePartner | null
    },
  })
  return <Card>
    <CardContent className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Globe className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div><h2 className="font-bold">{t('businesses.website.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('businesses.website.hint')}</p></div>
      </div>
      {query.isPending ? <p role="status" className="text-sm">{t('common.loading')}</p> : query.isError ?
        <div role="alert"><p className="text-sm text-destructive">{t('businesses.website.loadError')}</p><Button variant="outline" size="sm" onClick={() => query.refetch()}>{t('common.retry')}</Button></div> :
        <WebsitePartnerForm key={`${business.id}:${query.dataUpdatedAt}`} business={business} initial={query.data ?? null} />}
    </CardContent>
  </Card>
}

function WebsitePartnerForm({ business, initial }: { business: Business; initial: WebsitePartner | null }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(initial?.enabled ?? false)
  const [showName, setShowName] = useState(initial?.show_name ?? false)
  const [order, setOrder] = useState(String(initial?.sort_order ?? 100))
  const [names, setNames] = useState({ ar: initial?.name_ar ?? '', en: initial?.name_en ?? '', he: initial?.name_he ?? '' })
  const hasImage = /^https:\/\//.test(business.logo_url ?? '')
  const eligible = business.is_active && business.status === 'verified'
  const language = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('admin_save_website_partner', {
        p_business_id: business.id, p_enabled: enabled, p_sort_order: Number(order), p_show_name: showName,
        p_name_ar: names.ar.trim(), p_name_en: names.en.trim(), p_name_he: names.he.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t('businesses.website.saved'))
      queryClient.invalidateQueries({ queryKey: ['website-partner', business.id] })
      queryClient.invalidateQueries({ queryKey: ['business', business.id] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: () => toast.error(t('businesses.website.saveError')),
  })
  const valid = (!enabled || hasImage) && order.trim() !== '' && Number.isInteger(Number(order)) && Number(order) >= 0 && Number(order) <= 9999 && (!showName || Object.values(names).every(name => name.trim()))
  function submit(event: FormEvent) { event.preventDefault(); if (valid) save.mutate() }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={save.isPending} className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2"><Checkbox id="website-partner-enabled" checked={enabled} onCheckedChange={value => setEnabled(value === true)} /><Label htmlFor="website-partner-enabled">{t('businesses.website.enabled')}</Label></div>
        <div className="flex items-center gap-2"><Checkbox id="website-partner-name" checked={showName} onCheckedChange={value => setShowName(value === true)} /><Label htmlFor="website-partner-name">{t('businesses.website.showName')}</Label></div>
      </div>
      {!hasImage && <p className="text-sm text-amber-700 dark:text-amber-400">{t('businesses.website.noImage')}</p>}
      {!eligible && <p className="text-sm text-amber-700 dark:text-amber-400">{t('businesses.website.inactive')}</p>}
      <div className="flex flex-wrap items-start gap-5">
        {hasImage && <figure className="flex w-44 shrink-0 flex-col items-center gap-2 rounded-xl border bg-background p-3">
          <img src={business.logo_url!} alt="" className="size-20 rounded-xl object-contain" />
          {showName && <figcaption dir="auto" className="max-w-full break-words text-center text-sm font-semibold">{names[language] || business.name}</figcaption>}
          <span className="text-xs text-muted-foreground">{t('businesses.website.preview')}</span>
        </figure>}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="max-w-xs space-y-1.5"><Label htmlFor="website-partner-order">{t('businesses.website.order')}</Label><Input id="website-partner-order" type="number" min={0} max={9999} step={1} required value={order} onChange={e => setOrder(e.target.value)} /><p className="text-xs text-muted-foreground">{t('businesses.website.orderHint')}</p></div>
          {showName && <div className="grid gap-3 lg:grid-cols-3">{(['ar', 'en', 'he'] as const).map(lang => <div key={lang} className="min-w-0 space-y-1.5"><Label htmlFor={`website-name-${lang}`}>{t(`businesses.website.name_${lang}`)}</Label><Input id={`website-name-${lang}`} lang={lang} dir={lang === 'en' ? 'ltr' : 'rtl'} maxLength={80} required value={names[lang]} onChange={e => setNames(current => ({ ...current, [lang]: e.target.value }))} /></div>)}</div>}
        </div>
      </div>
      <Button type="submit" disabled={!valid || save.isPending}>{t(save.isPending ? 'businesses.website.saving' : 'businesses.website.save')}</Button>
    </fieldset>
  </form>
}
