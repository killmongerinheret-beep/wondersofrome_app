import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../constants/supabase';

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
    console.warn('Supabase is not configured. Some features may not work.');
    // Return a mock client to prevent crashes
    return null as any;
  }
  return client;
};
