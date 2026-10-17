import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ovbgtfgbxjaavnpsazvg.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Ymd0ZmdieGphYXZucHNhenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzE1NzUsImV4cCI6MjA4Njg0NzU3NX0.XGN3kKkAFQNaAT0eZjJ0QvxUFkhJxXhqJSN_6T18vOY';

/**
 * Normalizes any Supabase URL or project reference ID into a valid https:// URL.
 * Accepts:
 *  - "ovbgtfgbxjaavnpsazvg" -> "https://ovbgtfgbxjaavnpsazvg.supabase.co"
 *  - "ovbgtfgbxjaavnpsazvg.supabase.co" -> "https://ovbgtfgbxjaavnpsazvg.supabase.co"
 *  - "https://ovbgtfgbxjaavnpsazvg.supabase.co/" -> "https://ovbgtfgbxjaavnpsazvg.supabase.co"
 */
export const normalizeSupabaseUrl = (input?: string | null): string => {
  if (!input || typeof input !== 'string') return DEFAULT_SUPABASE_URL;
  let clean = input.trim().replace(/\/+$/, '');
  if (!clean) return DEFAULT_SUPABASE_URL;

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    if (clean.includes('.supabase.co')) {
      clean = `https://${clean}`;
    } else {
      clean = `https://${clean}.supabase.co`;
    }
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return clean;
    }
  } catch {
    console.warn(`Invalid Supabase URL "${input}", falling back to default.`);
  }
  return DEFAULT_SUPABASE_URL;
};

export const normalizeSupabaseKey = (input?: string | null): string => {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return input.trim();
};

export const getSupabaseUrl = (): string => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sweettrack_supabase_url') : null;
    if (saved && saved.trim()) return normalizeSupabaseUrl(saved);
  } catch {}
  
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL);
    
  return normalizeSupabaseUrl(envUrl);
};

export const getSupabaseAnonKey = (): string => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sweettrack_supabase_anon_key') : null;
    if (saved && saved.trim()) return normalizeSupabaseKey(saved);
  } catch {}
  
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY)
    || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY);
    
  return normalizeSupabaseKey(envKey);
};

const createSafeClient = (rawUrl?: string | null, rawKey?: string | null): SupabaseClient => {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = normalizeSupabaseKey(rawKey);
  try {
    return createClient(url, key);
  } catch (err) {
    console.error('Failed to create Supabase client with provided parameters, falling back to default:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
};

let currentClient: SupabaseClient = createSafeClient(getSupabaseUrl(), getSupabaseAnonKey());

export const getSupabaseClient = (): SupabaseClient => currentClient;

export const reconfigureSupabase = (url: string, key: string) => {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = normalizeSupabaseKey(key);
  try {
    localStorage.setItem('sweettrack_supabase_url', cleanUrl);
    localStorage.setItem('sweettrack_supabase_anon_key', cleanKey);
  } catch (e) {
    console.warn('Failed to save Supabase config to localStorage:', e);
  }
  currentClient = createSafeClient(cleanUrl, cleanKey);
  return currentClient;
};

export const resetSupabaseToDefault = () => {
  try {
    localStorage.removeItem('sweettrack_supabase_url');
    localStorage.removeItem('sweettrack_supabase_anon_key');
  } catch (e) {
    console.warn('Failed to clear Supabase config from localStorage:', e);
  }
  currentClient = createSafeClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
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
