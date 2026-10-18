import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { GuideTarget } from '../guide/GuideProvider'
import { RewardsGift } from './RewardsGift.web'
import './home.web.css'

function assetUri(asset: unknown): string {
  return typeof asset === 'string' ? asset : (asset as { uri: string }).uri
}

const media = {
  header: assetUri(require('./web-assets/road-header.png')),
  artwork: assetUri(require('./web-assets/home-art.png')),
  help: assetUri(require('./web-assets/help-3d.mp4')),
  helpPoster: assetUri(require('./web-assets/help-3d-poster.png')),
  helper: assetUri(require('./web-assets/helper-3d.mp4')),
  helperPoster: assetUri(require('./web-assets/helper-3d-poster.png'))
}

export const homeWebCopy = {
  ar: { giftAction: 'افتح هدية مزايا أخو', heading: 'أخو — المساعدة على الطريق', requestTitle: 'محتاج مساعدة؟', requestText: 'خلّينا نوصلك بحدا قريب', requestAction: 'بدي مساعدة', points: 'ساعد واكسب نقاط', helperTitle: 'في حدا محتاجك', helperAction: 'بدي أساعد', rewardsTitle: 'مساعدتك إلها قيمة', rewardsText: 'بدّل نقاطك بعروض مزايا أخو', rewardsAction: 'اكتشف' },
  en: { giftAction: 'Open the AKHOO perks gift', heading: 'AKHOO — Roadside help', requestTitle: 'Need help?', requestText: 'Connect with someone nearby', requestAction: 'I need help', points: 'Help & earn points', helperTitle: 'Lend a hand', helperAction: 'I want to help', rewardsTitle: 'Your help matters', rewardsText: 'Use your points for AKHOO perks', rewardsAction: 'Explore' },
  he: { giftAction: 'פתח את מתנת ההטבות של AKHOO', heading: 'AKHOO — עזרה בדרך', requestTitle: 'צריך עזרה?', requestText: 'נחבר אותך למישהו קרוב', requestAction: 'אני צריך עזרה', points: 'עוזרים וצוברים נקודות', helperTitle: 'מישהו צריך אותך', helperAction: 'אני רוצה לעזור', rewardsTitle: 'לעזרה שלך יש ערך', rewardsText: 'ממירים נקודות בהטבות AKHOO', rewardsAction: 'לגלות' }
} as const

type Copy = typeof homeWebCopy[keyof typeof homeWebCopy]

// Decorative videos never handle input. Pause when hidden, offscreen, unfocused,
// or covered by the usage guide, and respect changes to reduced-motion settings.
function MotionVideo({ src, poster, active }: { src: string; poster: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let disposed = false
    const shouldPlay = () => active && visible && !document.hidden && !preference.matches && !disposed
    const sync = () => {
      if (!shouldPlay()) { video.pause(); return }
      video.muted = true
      video.play().then(() => { if (!shouldPlay()) video.pause() }).catch(() => {})
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      sync()
    }, { threshold: 0.1 })
    observer.observe(video)
    preference.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      disposed = true
      observer.disconnect()
      preference.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      video.pause()
    }
  }, [active])
  return <video ref={ref} className="akh-home-video" src={src} poster={poster} muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-hidden />
}

function Arrow() {
  return <svg className="akh-home-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
}

export function HomeVisualHeader({ heading, children }: { heading: string; children: ReactNode }) {
  return <header className="akh-home-header">
    <img className="akh-home-landscape" src={media.header} alt="" width={2172} height={724} fetchPriority="high" />
    <h1 className="akh-home-sr-only">{heading}</h1>
    <div className="akh-home-bell">{children}</div>
  </header>
}

export function HomeVisualActions({ copy, active, onRequest, onHelp, onPerks }: { copy: Copy; active: boolean; onRequest: () => void; onHelp: () => void; onPerks: () => void }) {
  return <>
    <GuideTarget id="home.request">
      <section className="akh-home-request" aria-labelledby="akh-request-title">
        <MotionVideo src={media.help} poster={media.helpPoster} active={active} />
        <div className="akh-home-request-copy">
          <h2 id="akh-request-title">{copy.requestTitle}</h2>
          <p>{copy.requestText}</p>
        </div>
        <button className="akh-home-action akh-home-request-button" onClick={onRequest} type="button"><span>{copy.requestAction}</span><Arrow /></button>
      </section>
    </GuideTarget>
    <GuideTarget id="home.help">
      <section className="akh-home-helper" aria-labelledby="akh-helper-title">
        <div className="akh-home-helper-art"><MotionVideo src={media.helper} poster={media.helperPoster} active={active} /></div>
        <div className="akh-home-helper-copy">
          <span className="akh-home-points">{copy.points}</span>
          <h2 id="akh-helper-title">{copy.helperTitle}</h2>
          <button className="akh-home-action akh-home-helper-button" onClick={onHelp} type="button"><span>{copy.helperAction}</span><Arrow /></button>
        </div>
      </section>
    </GuideTarget>
    <GuideTarget id="home.perks">
      <section className="akh-home-rewards" aria-labelledby="akh-rewards-title">
        <RewardsGift active={active} label={copy.giftAction} artwork={media.artwork} onFallback={onPerks} />
        <div className="akh-home-rewards-copy"><h2 id="akh-rewards-title">{copy.rewardsTitle}</h2><p>{copy.rewardsText}</p></div>
        <button className="akh-home-action akh-home-rewards-button" onClick={onPerks} type="button"><span>{copy.rewardsAction}</span><Arrow /></button>
      </section>
    </GuideTarget>
  </>
}
