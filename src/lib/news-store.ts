import { supabase, type NewsItem } from "./supabase";

export type { NewsItem };

export async function getNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addNews(
  item: Omit<NewsItem, "id" | "created_at" | "hidden">,
): Promise<NewsItem> {
  const { data, error } = await supabase
    .from("news")
    .insert([item])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNews(id: string): Promise<void> {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
