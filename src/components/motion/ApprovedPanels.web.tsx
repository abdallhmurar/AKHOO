import { useTranslation } from 'react-i18next'
import { ArtIcon } from './Motion'
import { useIsRTL } from '../../lib/direction'
import type { IdentityProps } from './ApprovedPanels.types'
import './approved-perks.css'
import './approved-account.css'

export { LivePointsCard as PointsPanel } from './LivePointsCard'
export function AccountIdentity({ name, email, avatar, busy, onPhoto, onEdit }: IdentityProps) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  return <div className="approved-account"><section className="profile-card">
    <button type="button" className={`avatar-button ${avatar ? 'has-photo' : ''}`} onClick={onPhoto} disabled={busy} aria-label={t('account.menu.profile')}>
      {avatar ? <img src={avatar} alt="" /> : <ArtIcon name="person" size={56} />}
      <span className="camera-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/></svg></span>
    </button>
    <div className="profile-copy"><h2><bdi>{name}</bdi></h2><p dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>{email}</p><button className="edit-profile" type="button" onClick={onEdit}>{t('account.menu.profile')} <span aria-hidden="true">{isRTL ? '←' : '→'}</span></button></div>
  </section></div>
}
export function AccountHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="approved-account" style={{ margin: '-16px -20px 0' }}><header className="page-header"><img className="header-scenery" src="/motion/requester/assets/details-header.png" alt="" /><div><h1>{title}</h1><p>{subtitle}</p></div></header></div>
}
