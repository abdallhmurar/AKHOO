import { Loader2 } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
