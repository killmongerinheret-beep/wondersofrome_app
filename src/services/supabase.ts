import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../config/supabase';

const config = getSupabaseConfig();

export const supabase = config.isConfigured
  ? createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const getSupabase = () => {
  const client = supabase;
  if (!client) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return client;
};
