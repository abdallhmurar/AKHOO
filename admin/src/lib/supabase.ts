import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY - copy admin/.env.example to admin/.env')
}

// Anon/publishable key only - admin privileges are enforced entirely
// server-side (RLS + public.is_admin()), never by anything in this bundle.
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})
