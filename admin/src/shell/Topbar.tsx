import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/auth/useAuth'
import { useIsRTL } from '@/lib/direction'
import { BrandHeader, SidebarNav } from './Sidebar'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useCurrentAdminProfile } from './useCurrentAdminProfile'

export function Topbar() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { data: profile } = useCurrentAdminProfile()
  const isRTL = useIsRTL()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const initial = (profile?.full_name?.trim()?.[0] ?? 'A').toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label={t('common.back')}>
          <Menu className="size-5" />
        </Button>
        {/* The Sheet primitive's `side` variant is physical (left/right),
            not a CSS logical property, and its slide animation utilities
            (tailwindcss-animate) have no logical equivalent either - the
            one deliberate exception to this app's "no JS-level RTL
            branching" convention (see lib/i18n.ts's header comment). */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side={isRTL ? 'right' : 'left'} className="w-64 p-0">
            <SheetTitle className="sr-only">{t('nav.brand')}</SheetTitle>
            <BrandHeader />
            <div onClick={() => setMobileNavOpen(false)}>
              <SidebarNav />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{profile?.full_name || t('common.unknown')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={signOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="size-4" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
