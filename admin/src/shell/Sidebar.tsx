import { LayoutDashboard, ClipboardList, Users, HeartHandshake, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavItem } from './NavItem'

export function SidebarNav() {
  const { t } = useTranslation()
  return (
    <nav className="flex flex-col gap-1 p-3">
      <NavItem to="/" icon={LayoutDashboard} label={t('nav.dashboard')} />
      <NavItem to="/requests" icon={ClipboardList} label={t('nav.requests')} />
      <NavItem to="/users" icon={Users} label={t('nav.users')} />
      <NavItem to="/volunteers" icon={HeartHandshake} label={t('nav.volunteers')} />
      <NavItem to="/points" icon={Award} label={t('nav.points')} />
    </nav>
  )
}

function BrandHeader() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground">س</div>
      <div>
        <p className="text-sm font-extrabold leading-tight text-foreground">{t('nav.brand')}</p>
        <p className="text-xs leading-tight text-muted-foreground">{t('nav.console')}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-e border-border bg-card lg:flex lg:flex-col">
      <BrandHeader />
      <SidebarNav />
    </aside>
  )
}

export { BrandHeader }
