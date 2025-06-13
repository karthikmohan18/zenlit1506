import { createClient, Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ggikddsakyhyqylzjgpw.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaWtkZHNha3loeXF5bHpqZ3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjUyMzEsImV4cCI6MjA2NTQwMTIzMX0.UEBocnAERPglLIQE5dUI16SpOa-3zWCpUgYYS0VWR_A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return session
}
