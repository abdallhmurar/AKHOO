import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LivePointsCard } from '../../src/components/motion/LivePointsCard'
import { ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS, getVolunteerActivityLevel } from '../../src/lib/activityLevel'
import ar from '../../src/locales/ar.json'
import en from '../../src/locales/en.json'
import he from '../../src/locales/he.json'

const language = new URLSearchParams(location.search).get('lang') || 'ar'
void i18n.use(initReactI18next).init({ resources: { ar: { translation: ar }, en: { translation: en }, he: { translation: he } }, lng: language, fallbackLng: 'ar', interpolation: { escapeValue: false } })
const queryClient = new QueryClient()

function Preview() {
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState({ balance: 320, count: 42 })
  const [growing, setGrowing] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!growing) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setStats({ count: 60, balance: 600 }); setGrowing(false); return }
    const timer = setInterval(() => setStats(v => ({ count: Math.min(60, v.count + 1), balance: Math.min(600, v.balance + 10) })), 180)
    return () => clearInterval(timer)
  }, [growing])
  useEffect(() => { if (stats.count >= 60) setGrowing(false) }, [stats.count])
  const setSample = (count, balance = count * 10) => { setGrowing(false); setStats({ count, balance }) }
  const level = getVolunteerActivityLevel(stats.count)
  const next = Object.entries(ACTIVITY_LEVEL_THRESHOLDS).find(([, threshold]) => threshold > stats.count)
  const changeLanguage = value => { document.documentElement.lang = value; document.documentElement.dir = value === 'en' ? 'ltr' : 'rtl'; void i18n.changeLanguage(value) }
  return <main>
    <header className="preview-header"><span>AKHOO · LOCAL 3D PREVIEW</span><h1>{i18n.language === 'ar' ? 'مساعدتك بتكبّر الأثر' : i18n.language === 'he' ? 'ההשפעה שלך צומחת' : 'Watch your impact grow'}</h1><p>{i18n.language === 'ar' ? 'المس الشجرة وجرّب مراحل نموّها' : i18n.language === 'he' ? 'געו בעץ ונסו את שלבי הצמיחה' : 'Tap the tree and explore its growth'}</p></header>
    <div className="card-frame"><LivePointsCard key={revision} {...stats} target={next?.[1] ?? 60} level={level} levelLabel={t(ACTIVITY_LEVEL_LABEL_KEYS[level] || 'activityLevel.none')}
      remainingLabel={next ? t('perks.pointsCard.remainingToLevel', { remaining: next[1] - stats.count, levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[next[0]]) }) : t('points.topTier')} /></div>
    <aside className="preview-controls" aria-label="Preview controls">
      <p>معاينة محلية · الأرقام هون للتجربة فقط</p>
      <div className="controls-row"><button onClick={() => { if (growing) setGrowing(false); else { setStats({ count: 0, balance: 0 }); setRevision(v => v + 1); setGrowing(true) } }}>{growing ? 'وقّف التجربة' : 'شوف نمو الشجرة'}</button><button onClick={() => setSample(stats.count + 1, stats.balance + 10)}>مساعدة جديدة +1</button><button onClick={() => setSample(42, 320)}>مثل الصورة</button></div>
      <label className="growth-control">{stats.count} مساعدة <input aria-label="Preview help count" type="range" min="0" max="60" value={Math.min(60, stats.count)} onChange={e => setSample(Number(e.target.value))} /></label>
      <div className="controls-row"><label>المستوى <select aria-label="Preview level" value={level} onChange={e => setSample({ none: 0, bronze: 8, silver: 20, gold: 42, green: 65 }[e.target.value])}><option value="none">جديد</option><option value="bronze">برونزي</option><option value="silver">فضي</option><option value="gold">ذهبي</option><option value="green">أخوو الأخضر</option></select></label><label>اللغة <select aria-label="Preview language" value={i18n.language} onChange={e => changeLanguage(e.target.value)}><option value="ar">العربية</option><option value="en">English</option><option value="he">עברית</option></select></label></div>
      <p>الشجرة رمز لأثر المساعدة، مش زراعة شجرة حقيقية.</p>
    </aside>
  </main>
}
document.documentElement.lang = language
document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><Preview /></QueryClientProvider>)
