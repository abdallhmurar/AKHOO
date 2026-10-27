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
const previewCopy = {
  ar: { demo: 'معاينة محلية · الأرقام هون للتجربة فقط', start: 'جرّب تغيّر المستويات', stop: 'وقّف التجربة', add: 'مساعدة جديدة +1', reset: 'مثل الصورة', count: 'مساعدة', level: 'المستوى', language: 'اللغة', note: 'تبديل المستويات هون للمعاينة بس؛ بالتطبيق المستوى حسب المساعدات المكتملة.' },
  en: { demo: 'Local preview · sample numbers only', start: 'Try level progression', stop: 'Stop demo', add: '+1 completed help', reset: 'Match the concept', count: 'completed helps', level: 'Level', language: 'Language', note: 'These level controls are for preview only. In the app, levels follow completed help requests.' },
  he: { demo: 'תצוגה מקומית · נתונים לדוגמה בלבד', start: 'נסו את מעבר הרמות', stop: 'עצירת ההדגמה', add: 'הוספת עזרה אחת', reset: 'כמו בתמונה', count: 'עזרות שהושלמו', level: 'רמה', language: 'שפה', note: 'בחירת הרמות כאן היא להדגמה בלבד. באפליקציה הרמה נקבעת לפי בקשות עזרה שהושלמו.' },
}

function Preview() {
  const { t, i18n } = useTranslation()
  const copy = previewCopy[i18n.language] || previewCopy.ar
  const [stats, setStats] = useState({ balance: 320, count: 42 })
  const [growing, setGrowing] = useState(false)
  const [revision, setRevision] = useState(0)
  const [previewName, setPreviewName] = useState('')
  useEffect(() => {
    if (!growing) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setStats({ count: 60, balance: 600 }); setGrowing(false); return }
    const timer = setInterval(() => setStats(v => ({ count: Math.min(60, v.count + 1), balance: Math.min(600, v.balance + 10) })), 400)
    return () => clearInterval(timer)
  }, [growing])
  useEffect(() => { if (stats.count >= 60) setGrowing(false) }, [stats.count])
  const setSample = (count, balance = count * 10) => { setGrowing(false); setStats({ count, balance }) }
  const level = getVolunteerActivityLevel(stats.count)
  const next = Object.entries(ACTIVITY_LEVEL_THRESHOLDS).find(([, threshold]) => threshold > stats.count)
  const changeLanguage = value => { document.documentElement.lang = value; document.documentElement.dir = value === 'en' ? 'ltr' : 'rtl'; void i18n.changeLanguage(value) }
  return <main>
    <header className="preview-header"><span>{i18n.language === 'ar' ? 'تصوّر توضيحي' : i18n.language === 'he' ? 'תצוגה מקומית לדוגמה' : 'Local design preview'}</span></header>
    <div className="card-frame"><LivePointsCard key={revision} {...stats} name={previewName} target={next?.[1] ?? 60} level={level} levelLabel={t(ACTIVITY_LEVEL_LABEL_KEYS[level] || 'activityLevel.none')}
      remainingLabel={next ? t('perks.pointsCard.remainingToLevel', { remaining: next[1] - stats.count, levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[next[0]]) }) : t('points.topTier')} /></div>
    <aside className="preview-controls" aria-label="Preview controls">
      <p>{copy.demo}</p>
      <div className="controls-row"><button onClick={() => { if (growing) setGrowing(false); else { setStats({ count: 0, balance: 0 }); setRevision(v => v + 1); setGrowing(true) } }}>{growing ? copy.stop : copy.start}</button><button onClick={() => setSample(stats.count + 1, stats.balance + 10)}>{copy.add}</button><button onClick={() => setSample(42, 320)}>{copy.reset}</button></div>
      <label className="growth-control">{stats.count} {copy.count} <input aria-label="Preview help count" type="range" min="0" max="60" value={Math.min(60, stats.count)} onChange={e => setSample(Number(e.target.value))} /></label>
      <div className="controls-row"><label>{copy.level} <select aria-label="Preview level" value={level} onChange={e => setSample({ none: 0, bronze: 8, silver: 20, gold: 42, green: 65 }[e.target.value])}>{['none', 'bronze', 'silver', 'gold', 'green'].map(rank => <option key={rank} value={rank}>{t(ACTIVITY_LEVEL_LABEL_KEYS[rank] || 'activityLevel.none')}</option>)}</select></label><label>{copy.language} <select aria-label="Preview language" value={i18n.language} onChange={e => changeLanguage(e.target.value)}><option value="ar">العربية</option><option value="en">English</option><option value="he">עברית</option></select></label></div>
      <div className="controls-row"><label>{t('perks.helperCard.namePlaceholder')} <input aria-label="Preview name" type="text" value={previewName} onChange={e => setPreviewName(e.target.value)} /></label><label>{t('perks.helperCard.balance')} <input aria-label="Preview balance" type="number" min="0" value={stats.balance} onChange={e => setSample(stats.count, Math.max(0, Number(e.target.value) || 0))} /></label></div>
      <p>{copy.note}</p>
    </aside>
  </main>
}
document.documentElement.lang = language
document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><Preview /></QueryClientProvider>)
