import { useState } from 'react'
import { LoginScreen } from './LoginScreen'
import { SignUpScreen } from './SignUpScreen'
import { ForgotPasswordScreen } from './ForgotPasswordScreen'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [forgotEmail, setForgotEmail] = useState('')

  if (mode === 'signup') {
    return <SignUpScreen onLogin={() => setMode('login')} onCreated={() => setMode('login')} />
  }

  if (mode === 'forgot') {
    return <ForgotPasswordScreen initialEmail={forgotEmail} onBack={() => setMode('login')} />
  }

  return (
    <LoginScreen
      onSignUp={() => setMode('signup')}
      onForgotPassword={email => { setForgotEmail(email); setMode('forgot') }}
    />
  )
}
