import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ovbgtfgbxjaavnpsazvg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Ymd0ZmdieGphYXZucHNhenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzE1NzUsImV4cCI6MjA4Njg0NzU3NX0.XGN3kKkAFQNaAT0eZjJ0QvxUFkhJxXhqJSN_6T18vOY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
