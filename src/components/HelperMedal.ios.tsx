import { useTranslation } from 'react-i18next'
import { HelperMedalArtwork } from './HelperMedalArtwork'
import { InteractiveScene } from './motion/InteractiveScene.ios'
import { ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS, type ActivityLevel } from '../lib/activityLevel'

export function HelperMedal({ level, size = 52 }: { level: ActivityLevel; size?: number }) {
  const { t, i18n } = useTranslation()
  const fallback = <HelperMedalArtwork level={level} size={size} />
  if (level === 'none') return fallback
  const hint = i18n.language.startsWith('ar') ? 'اضغط لتدوير الميدالية' : i18n.language.startsWith('he') ? 'לחצו לסיבוב המדליה' : 'Tap to spin the medal'
  return <InteractiveScene kind="medal" width={size} height={size * 1.25} label={t(ACTIVITY_LEVEL_LABEL_KEYS[level])} hint={hint}
    metal={level === 'silver' ? '#ced8e2' : ACTIVITY_LEVEL_COLORS[level]} fallback={fallback} />
}
