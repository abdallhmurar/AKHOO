import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({ message, icon: Icon = Inbox, action }: { message: string; icon?: typeof Inbox; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
