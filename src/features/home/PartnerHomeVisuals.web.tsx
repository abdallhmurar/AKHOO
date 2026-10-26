import type { ReactNode } from 'react'
import { GuideTarget } from '../guide/GuideProvider'
import { Arrow, MotionVideo, homeWebCopy } from './HomeVisuals.web'
import { partnerBetaCopy } from './partnerBetaCopy'
import './partner-home.web.css'

function assetUri(asset: unknown): string {
  return typeof asset === 'string' ? asset : (asset as { uri: string }).uri
}

const media = {
  banner: assetUri(require('./web-assets/partner-approved-loop.mp4')),
  bannerPoster: assetUri(require('./web-assets/partner-approved-poster.jpg')),
  rose: assetUri(require('./web-assets/help-rose-loop.mp4')),
  rosePoster: assetUri(require('./web-assets/help-rose-poster.jpg')),
  helper: assetUri(require('./web-assets/helper-3d.mp4')),
  helperPoster: assetUri(require('./web-assets/helper-3d-poster.png'))
}

type Language = 'ar' | 'en' | 'he'

// The partner / home layout of the iPhone TestFlight build 2.0.4 (31), for the web app: partner banner, rose help card,
// helper card, blue rewards ticket. Art sits on the left and copy on the right in every language, exactly as on the
// iPhone, so the container is physically left-to-right and each text block carries its own `dir`.
export function PartnerHomeVisuals({ language, rtl, active, bell, resume, onJoin, onRequest, onHelp, onPerks }: {
  language: Language
  rtl: boolean
  active: boolean
  bell: ReactNode
  resume?: ReactNode
  onJoin: () => void
  onRequest: () => void
  onHelp: () => void
  onPerks: () => void
}) {
  const copy = partnerBetaCopy[language]
  const home = homeWebCopy[language]
  const textDir = rtl ? 'rtl' : 'ltr'

  return <div className="akh-ph">
    <section className="akh-ph-banner" aria-labelledby="akh-ph-banner-title">
      <div className="akh-ph-banner-art"><MotionVideo src={media.banner} poster={media.bannerPoster} active={active} /></div>
      <div className="akh-ph-bell">{bell}</div>
      <div className="akh-ph-banner-copy" dir={textDir}>
        <span className="akh-ph-brand">{copy.brand}</span>
        <h2 id="akh-ph-banner-title">{copy.bannerTitle}</h2>
        <p>{copy.bannerText}</p>
        <button className="akh-ph-join" type="button" onClick={onJoin}>{copy.join}</button>
      </div>
    </section>

    {resume}

    <GuideTarget id="home.request">
      <button className="akh-ph-help" type="button" onClick={onRequest} aria-label={`${home.requestTitle}. ${home.requestAction}`}>
        <span className="akh-ph-help-art"><MotionVideo src={media.rose} poster={media.rosePoster} active={active} /></span>
        <span className="akh-ph-help-copy" dir={textDir}>
          <span className="akh-ph-help-title">{home.requestTitle}</span>
          <span className="akh-ph-help-text">{home.requestText}</span>
        </span>
        <span className="akh-ph-help-action"><span>{home.requestAction}</span><Arrow /></span>
      </button>
    </GuideTarget>

    <GuideTarget id="home.help">
      <section className="akh-home-helper" aria-labelledby="akh-ph-helper-title" dir={textDir}>
        <div className="akh-home-helper-art"><MotionVideo src={media.helper} poster={media.helperPoster} active={active} /></div>
        <div className="akh-home-helper-copy">
          <span className="akh-home-points">{home.points}</span>
          <h2 id="akh-ph-helper-title">{home.helperTitle}</h2>
        </div>
        <button className="akh-home-action akh-home-helper-button" onClick={onHelp} type="button"><span>{home.helperAction}</span><Arrow /></button>
      </section>
    </GuideTarget>

    <GuideTarget id="home.perks">
      <button className="akh-ph-ticket" type="button" dir={textDir} onClick={onPerks} aria-label={`${copy.rewardsTitle}. ${copy.rewardsText}. ${copy.explore}`}>
        <span className="akh-ph-coupons" aria-hidden="true">
          <span className="akh-ph-coupon akh-ph-coupon-back" />
          <span className="akh-ph-coupon">%</span>
        </span>
        <span className="akh-ph-ticket-copy">
          <span className="akh-ph-ticket-title">{copy.rewardsTitle}</span>
          <span className="akh-ph-ticket-text">{copy.rewardsText}</span>
        </span>
        <span className="akh-ph-stub"><span>{copy.explore}</span><span className="akh-ph-stub-arrow" aria-hidden="true">{rtl ? '←' : '→'}</span></span>
      </button>
    </GuideTarget>
  </div>
}
