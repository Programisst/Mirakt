import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

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
