import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StatCard({ label, value, icon: Icon, isLoading }: { label: string; value: number | string; icon: LucideIcon; isLoading?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {isLoading ? <Skeleton className="mt-1 h-6 w-16" /> : <p className="text-xl font-extrabold text-foreground">{value}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
