import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
import { i18next, initI18n } from '@/lib/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import App from './App'
import './index.css'

initI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        {/* Vite exposes whatever `base` (vite.config.ts, overridable via
            VITE_BASE_PATH) was set at build time as import.meta.env.BASE_URL
            - deriving the router's basename from it instead of hardcoding
            keeps the two permanently in sync across environments (e.g. this
            repo's GitHub Pages deploy under /sanad/admin/ vs a future
            standalone domain at /). */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
    <Toaster richColors closeButton position="top-center" />
  </StrictMode>
)
