import {
  LayoutDashboard, ClipboardList, Users, Award, Store, Tag, Star, Map,
  Medal, Ticket, Flag, Bell, Image, Crown, MessagesSquare
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSupportOpenCount, useSupportRealtime } from '@/pages/support/useSupport'
import { NavItem } from './NavItem'

function SectionLabel({ children }: { children: string }) {
  return <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-navy-textMuted/70">{children}</p>
}

export function SidebarNav() {
  const { t } = useTranslation()
  // Rendered twice (desktop aside + the mobile sheet) but only one is ever
  // mounted at a time; the count is what tells the admin someone is waiting.
  const openSupport = useSupportOpenCount().data ?? 0
  useSupportRealtime()
  return (
    <nav className="flex flex-col gap-1 p-3">
      <SectionLabel>{t('nav.sections.overview')}</SectionLabel>
      <NavItem to="/" icon={LayoutDashboard} label={t('nav.dashboard')} />
      <NavItem to="/map" icon={Map} label={t('nav.map')} />
      <NavItem to="/support" icon={MessagesSquare} label={t('nav.support')} badge={openSupport > 0 ? String(openSupport) : undefined} />

      <SectionLabel>{t('nav.sections.community')}</SectionLabel>
      <NavItem to="/requests" icon={ClipboardList} label={t('nav.requests')} />
      <NavItem to="/users" icon={Users} label={t('nav.users')} />
      <NavItem to="/points" icon={Award} label={t('nav.points')} />
      <NavItem to="/mission-ratings" icon={Medal} label={t('nav.missionRatings')} />

      <SectionLabel>{t('nav.sections.commerce')}</SectionLabel>
      <NavItem to="/businesses" icon={Store} label={t('nav.businesses')} />
      <NavItem to="/offers" icon={Tag} label={t('nav.offers')} />
      <NavItem to="/redemptions" icon={Ticket} label={t('nav.redemptions')} />
      <NavItem to="/reviews" icon={Star} label={t('nav.reviews')} />

      <SectionLabel>{t('nav.sections.safety')}</SectionLabel>
      <NavItem to="/reports" icon={Flag} label={t('nav.reports')} />

      <SectionLabel>{t('nav.sections.growth')}</SectionLabel>
      <NavItem to="/notifications" icon={Bell} label={t('nav.notifications')} />
      <NavItem to="/content" icon={Image} label={t('nav.content')} />
      <NavItem to="/pro-max" icon={Crown} label={t('nav.proMax')} badge={t('proMax.comingSoonTitle')} />
    </nav>
  )
}

function BrandHeader() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-teal text-lg font-extrabold text-white">أ</div>
      <div>
        <p className="text-sm font-extrabold leading-tight text-navy-text">{t('nav.brand')}</p>
        <p className="text-xs leading-tight text-navy-textMuted">{t('nav.console')}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-e border-navy-border bg-navy lg:flex lg:flex-col">
      <BrandHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  )
}

export { BrandHeader }
