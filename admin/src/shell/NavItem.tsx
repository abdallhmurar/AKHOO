import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

// Lives on the navy sidebar surface (both the desktop aside and the mobile
// Sheet - see Sidebar.tsx/Topbar.tsx), so its colors are hardcoded against
// that dark background rather than the app's light-mode `foreground`/
// `secondary` tokens, which would be unreadable here.
export function NavItem({ to, icon: Icon, label, badge }: { to: string; icon: LucideIcon; label: string; badge?: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-teal text-white' : 'text-navy-textMuted hover:bg-navy-light hover:text-navy-text'
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">{badge}</span> : null}
    </NavLink>
  )
}
