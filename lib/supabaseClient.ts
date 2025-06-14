import { createClient, Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      } else {
        console.log('Initial session:', data.session?.user?.id || 'No session');
        setSession(data.session);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id || 'No session');
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return session;
}