import { useState } from 'react'
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
  const level = getVolunteerActivityLevel(stats.count)
  const next = Object.entries(ACTIVITY_LEVEL_THRESHOLDS).find(([, threshold]) => threshold > stats.count)
  const changeLanguage = value => { document.documentElement.lang = value; document.documentElement.dir = value === 'en' ? 'ltr' : 'rtl'; void i18n.changeLanguage(value) }
  return <main>
    <header className="preview-header"><span>AKHOO · DESIGN PREVIEW</span><h1>{i18n.language === 'ar' ? 'مساعدتك إلها قيمة' : i18n.language === 'he' ? 'לעזרה שלך יש ערך' : 'Your help makes a difference'}</h1><p>{i18n.language === 'ar' ? 'اضغط عالميدالية وجرّب حركة النقاط' : i18n.language === 'he' ? 'לחצו על המדליה ונסו את תנועת הנקודות' : 'Tap the medal and try the points animation'}</p></header>
    <div className="card-frame"><LivePointsCard {...stats} target={next?.[1] ?? 60} level={level} levelLabel={t(ACTIVITY_LEVEL_LABEL_KEYS[level] || 'activityLevel.none')}
      remainingLabel={next ? t('perks.pointsCard.remainingToLevel', { remaining: next[1] - stats.count, levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[next[0]]) }) : t('points.topTier')} /></div>
    <aside className="preview-controls" aria-label="Preview controls">
      <p>معاينة محلية · الأرقام هون للتجربة فقط</p>
      <div className="controls-row"><button onClick={() => setStats(v => ({ balance: v.balance + 10, count: v.count + 1 }))}>جرّب زيادة النقاط +10</button><button onClick={() => setStats({ balance: 320, count: 42 })}>إعادة</button></div>
      <div className="controls-row"><label>المستوى <select aria-label="Preview level" value={level} onChange={e => { const count = { none: 0, bronze: 8, silver: 20, gold: 42, green: 65 }[e.target.value]; setStats({ balance: count ? 320 : 0, count }) }}><option value="none">جديد</option><option value="bronze">برونزي</option><option value="silver">فضي</option><option value="gold">ذهبي</option><option value="green">أخوو الأخضر</option></select></label><label>اللغة <select aria-label="Preview language" value={i18n.language} onChange={e => changeLanguage(e.target.value)}><option value="ar">العربية</option><option value="en">English</option><option value="he">עברית</option></select></label></div>
    </aside>
  </main>
}
document.documentElement.lang = language
document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><Preview /></QueryClientProvider>)
