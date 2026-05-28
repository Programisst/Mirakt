import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  _client = createClient(url, key);
  return _client;
}

// Обратная совместимость — везде где импортируют { supabase }
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type NewsItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  content: string;
  image_url: string;
  created_at: string;
  hidden: boolean;
};
