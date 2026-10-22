import { useTranslation } from 'react-i18next'
import { MotionScene } from './Motion'
import './approved-request.css'

export function FlowHeader({ onBack, step }: { onBack: () => void; step?: number }) {
  const { t } = useTranslation()
  return <div className="approved-request"><header className="topbar">
    <button type="button" className="round-control flow-back" onClick={onBack} aria-label={t('common.back')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button>
    {step ? <div className="progress"><div className="progress-segments" aria-hidden="true">{[1, 2, 3].map(n => <i key={n} className={n === step ? 'current' : n < step ? 'complete' : ''} />)}</div><span>{t('request.step.details.stepOf', { current: step, total: 3 })}</span></div> : <span />}
  </header></div>
}
export function RequestHeading({ title, subtitle, selection = false }: { title: string; subtitle: string; selection?: boolean }) {
  return <div className="approved-request" style={{ margin: '-16px -20px 0' }}>
    {selection ? <div className="hero"><img src="/motion/requester/assets/header.png" alt="" /><div className="hero-copy"><h1>{title}</h1><p>{subtitle}</p></div></div> : <div className="approved-details-hero"><img className="details-scenery" src="/motion/requester/assets/details-header.png" alt="" /><div className="details-heading"><h1>{title}</h1><p>{subtitle}</p></div></div>}
  </div>
}
export function RequestChoice({ kind, title, description, selected, onSelect }: { kind: string; title: string; description: string; selected: boolean; onSelect: () => void }) {
  return <div className="approved-request"><label className="problem-card" data-kind={kind}>
    <input type="radio" name="request-problem" value={kind} checked={selected} onChange={onSelect} aria-label={title} />
    <span className="radio-mark" aria-hidden="true" />
    <span className="card-copy"><strong>{title}</strong><span>{description}</span></span>
    <MotionScene name={kind} className="scene is-playing" />
  </label></div>
}
export function SelectedProblem({ kind, title, label }: { kind: string; title: string; label: string }) {
  return <div className="approved-request"><div className="selected-problem" data-kind={kind}><div className="selected-copy"><span>{label}</span><strong>{title}</strong></div><MotionScene name={kind} className="scene is-playing" /></div></div>
}
