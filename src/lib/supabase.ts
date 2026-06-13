import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseEnabled = Boolean(url && key);

export const supabase = isSupabaseEnabled ? createClient(url, key) : null;
