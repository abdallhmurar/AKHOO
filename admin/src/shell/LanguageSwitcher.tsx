import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { setAppLanguage } from '@/lib/i18n'
import type { AppLanguage } from '@/lib/i18n'

const LANGUAGE_LABELS: Record<AppLanguage, string> = { ar: 'العربية', he: 'עברית', en: 'English' }

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('common.language')}>
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LANGUAGE_LABELS) as AppLanguage[]).map(lang => (
          <DropdownMenuItem key={lang} onSelect={() => setAppLanguage(lang)} className={i18n.language === lang ? 'font-bold' : undefined}>
            {LANGUAGE_LABELS[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
