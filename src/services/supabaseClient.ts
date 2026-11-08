import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  );
};

// Singleton client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Sign in using Google OAuth Provider via Supabase
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      error: new Error('Supabase credentials are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Supabase Google Sign-In Error:', err);
    return { error: err };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    console.error('Supabase Sign-Out Error:', err);
    return { error: err };
  }
}

/**
 * Get the currently logged-in user
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.warn('Failed to retrieve Supabase user:', err);
    return null;
  }
}

/**
 * Get active session
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.warn('Failed to retrieve Supabase session:', err);
    return null;
  }
}

/**
 * Subscribe to Supabase auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null, user: User | null) => void
): { unsubscribe: () => void } {
  if (!supabase || !isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session, session?.user || null);
  });

  return {
    unsubscribe: () => subscription.unsubscribe()
  };
}

/**
 * Fetch public profile from Supabase profiles table
 */
export async function fetchSupabaseProfile(userId: string) {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Failed to fetch profile from Supabase:', err);
    return null;
  }
}

