import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { useAppFont, normalizeTypographyLanguage } from '../../lib/typography'
import { partnerBetaCopy } from './partnerBetaCopy'
import { emptyPartnerDraft, normalizePartnerPhone, partnerDraftErrors, type PartnerDraft } from './partnerBetaModel'
import './partner-home.web.css'

const fields = ['business', 'city', 'phone', 'offer'] as const
const limits = { business: 80, city: 60, phone: 24, offer: 280 } as const

// The partner application preview of the iPhone beta, for the web app. It is memory-only on purpose: nothing is sent,
// stored or logged, and the screen says so. Full-screen dialog, closes with Escape or the back button.
export function PartnerEnrollment({ onClose }: { onClose: () => void }) {
  const { i18n } = useTranslation()
  const language = normalizeTypographyLanguage(i18n.language)
  const copy = partnerBetaCopy[language]
  const theme = useSanadTheme()
  const rtl = useIsRTL()
  const bold = useAppFont('bold')
  const extra = useAppFont('extraBold')
  const [draft, setDraft] = useState<PartnerDraft>({ ...emptyPartnerDraft })
  const [stage, setStage] = useState<'details' | 'review' | 'done'>('details')
  const [faq, setFaq] = useState<number | null>(0)
  const [attempted, setAttempted] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const inputs = useRef<Partial<Record<keyof PartnerDraft, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const errors = attempted ? partnerDraftErrors(draft) : []
  const dir = rtl ? 'rtl' : 'ltr'

  const back = () => {
    if (stage === 'details' || stage === 'done') onClose()
    else { setStage('details'); root.current?.scrollTo({ top: 0 }) }
  }
  const backRef = useRef(back)
  backRef.current = back

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    backButton.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') backRef.current() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.() }
  }, [])

  const next = () => {
    setAttempted(true)
    const invalid = partnerDraftErrors(draft)
    const first = invalid[0]
    if (first) { inputs.current[first]?.focus(); return }
    setStage('review')
    root.current?.scrollTo({ top: 0 })
  }
  const set = (key: keyof PartnerDraft, value: string | number) => setDraft(current => ({ ...current, [key]: value }))

  const style = {
    '--ph-bg': theme.colors.background, '--ph-surface': theme.colors.surface, '--ph-border': theme.colors.border,
    '--ph-ink': theme.colors.textPrimary, '--ph-muted': theme.colors.textSecondary, '--ph-accent': theme.colors.community,
    '--akh-font': bold, '--akh-bold': bold, '--akh-extra': extra
  } as CSSProperties

  return createPortal(
    <div ref={root} className="akh-pe" role="dialog" aria-modal="true" aria-labelledby="akh-pe-title" dir={dir} lang={language} style={style}>
      <header className="akh-pe-header">
        <button ref={backButton} className="akh-pe-back" type="button" aria-label={copy.back} onClick={back}>{rtl ? '→' : '←'}</button>
        <strong id="akh-pe-title">{copy.brand}</strong>
      </header>
      <div className="akh-pe-body">
        {stage === 'details' ? <>
          <div className="akh-pe-hero"><img src={assetUriOf(require('./web-assets/partner-approved-poster.jpg'))} alt="" width={1648} height={544} /></div>
          <div className="akh-pe-copy">
            <span className="akh-pe-intro">{copy.intro}</span>
            <h1>{copy.heading}</h1>
            <p>{copy.description}</p>
          </div>
          <section className="akh-pe-panel" aria-label={copy.faqTitle}>
            <span className="akh-pe-label">{copy.faqLabel}</span>
            <h2>{copy.faqTitle}</h2>
            {copy.faq.map((item, index) => <div key={item.q} className="akh-pe-question">
              <button type="button" aria-expanded={faq === index} onClick={() => setFaq(faq === index ? null : index)}>
                <span>{item.q}</span><span aria-hidden="true">{faq === index ? '−' : '+'}</span>
              </button>
              {faq === index ? <p>{item.a}</p> : null}
            </div>)}
          </section>
          <div className="akh-pe-steps"><strong>1 · {copy.details}</strong><span>2 · {copy.review}</span></div>
          <form className="akh-pe-panel" noValidate onSubmit={event => { event.preventDefault(); next() }}>
            {fields.map(field => {
              const invalid = field !== 'offer' && errors.includes(field)
              const common = {
                id: `akh-pe-${field}`, value: draft[field], maxLength: limits[field], 'aria-invalid': invalid || undefined,
                'aria-describedby': invalid ? `akh-pe-${field}-error` : undefined, onChange: (event: { target: { value: string } }) => set(field, event.target.value)
              }
              return <div key={field} className="akh-pe-field">
                <label htmlFor={`akh-pe-${field}`}>{copy[field]}</label>
                {field === 'offer'
                  ? <textarea {...common} ref={element => { inputs.current[field] = element }} rows={4} />
                  : <input {...common} ref={element => { inputs.current[field] = element }} type={field === 'phone' ? 'tel' : 'text'} inputMode={field === 'phone' ? 'tel' : undefined} autoComplete={field === 'phone' ? 'tel' : 'off'} dir={field === 'phone' ? 'ltr' : undefined} />}
                {invalid ? <span id={`akh-pe-${field}-error`} className="akh-pe-error" role="alert">{copy.errors[field]}</span> : null}
                {field === 'offer' ? <span className="akh-pe-count">{draft.offer.length}/280</span> : null}
              </div>
            })}
            <div className="akh-pe-field" role="radiogroup" aria-label={copy.category}>
              <span className="akh-pe-fieldlabel">{copy.category}</span>
              <div className="akh-pe-chips">
                {copy.categories.map((label, index) => <button key={label} type="button" role="radio" aria-checked={draft.category === index} data-on={draft.category === index} onClick={() => set('category', index)}>{label}</button>)}
              </div>
              {errors.includes('category') ? <span className="akh-pe-error" role="alert">{copy.errors.category}</span> : null}
            </div>
            <p className="akh-pe-notice">{copy.notice}</p>
            <button className="akh-pe-primary" type="submit">{copy.next}</button>
          </form>
        </> : stage === 'review' ? <>
          <h1>{copy.review}</h1>
          <section className="akh-pe-panel">
            {(['business', 'category', 'city', 'phone', 'offer'] as const).map(field => <div key={field} className="akh-pe-row">
              <span>{copy[field]}</span>
              <strong dir={field === 'phone' ? 'ltr' : undefined}>{field === 'category' ? copy.categories[draft.category] : field === 'phone' ? normalizePartnerPhone(draft.phone) : draft[field].trim() || '—'}</strong>
            </div>)}
          </section>
          <p className="akh-pe-notice">{copy.notice}</p>
          <button className="akh-pe-primary" type="button" onClick={() => { setStage('done'); root.current?.scrollTo({ top: 0 }) }}>{copy.send}</button>
          <button className="akh-pe-secondary" type="button" onClick={back}>{copy.edit}</button>
        </> : <section className="akh-pe-panel">
          <span className="akh-pe-check" aria-hidden="true">✓</span>
          <h1>{copy.done}</h1>
          <p>{copy.doneText}</p>
          <button className="akh-pe-primary" type="button" onClick={onClose}>{copy.close}</button>
        </section>}
      </div>
    </div>,
    document.body
  )
}

function assetUriOf(asset: unknown): string {
  return typeof asset === 'string' ? asset : (asset as { uri: string }).uri
}
