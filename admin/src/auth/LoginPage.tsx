import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message.toLowerCase().includes('invalid') ? t('auth.invalidCredentials') : t('auth.genericError'))
    }
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border shadow-sm">
        <CardHeader className="items-center gap-1 text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground">س</div>
          <h1 className="text-2xl font-extrabold text-foreground">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} dir="ltr" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
