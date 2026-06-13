import { createClient } from '@supabase/supabase-js';

/** GitHub Secrets·메모장 복사 시 붙는 공백·한글·BOM 제거 */
function sanitizeAscii(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/[^\x20-\x7E]/g, '');
}

function readEnv(raw: string | undefined, prefix: string): string {
  let v = sanitizeAscii(raw ?? '');
  if (v.startsWith(prefix)) v = v.slice(prefix.length).trim();
  return v;
}

const url = readEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL=')
  .replace(/\/$/, '');

const key = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY=');

export const isSupabaseEnabled = Boolean(url && key);

export const supabase = isSupabaseEnabled
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
