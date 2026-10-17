import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ovbgtfgbxjaavnpsazvg.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Ymd0ZmdieGphYXZucHNhenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzE1NzUsImV4cCI6MjA4Njg0NzU3NX0.XGN3kKkAFQNaAT0eZjJ0QvxUFkhJxXhqJSN_6T18vOY';

export const getSupabaseUrl = (): string => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sweettrack_supabase_url') : null;
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL);
  return envUrl || DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sweettrack_supabase_anon_key') : null;
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY);
  return envKey || DEFAULT_SUPABASE_ANON_KEY;
};

let currentClient: SupabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());

export const getSupabaseClient = (): SupabaseClient => currentClient;

export const reconfigureSupabase = (url: string, key: string) => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  try {
    localStorage.setItem('sweettrack_supabase_url', cleanUrl);
    localStorage.setItem('sweettrack_supabase_anon_key', cleanKey);
  } catch (e) {
    console.warn('Failed to save Supabase config to localStorage:', e);
  }
  currentClient = createClient(cleanUrl, cleanKey);
  return currentClient;
};

export const resetSupabaseToDefault = () => {
  try {
    localStorage.removeItem('sweettrack_supabase_url');
    localStorage.removeItem('sweettrack_supabase_anon_key');
  } catch (e) {
    console.warn('Failed to clear Supabase config from localStorage:', e);
  }
  currentClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  return currentClient;
};

// Proxy allows all existing imports of `supabase` to dynamically use the latest active client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
