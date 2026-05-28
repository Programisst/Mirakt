import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://mirakt.ru";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: new Date(), changeFrequency: "hourly",  priority: 1.0 },
    { url: `${BASE}/o-nas`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/kontakty`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/konfidencialnost`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/terms`,               lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/search`,              lastModified: new Date(), changeFrequency: "weekly",  priority: 0.5 },
    { url: `${BASE}/support`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // Редакционные статьи из Supabase
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("news")
      .select("id, created_at")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(500);

    articlePages = (data ?? []).map((a) => ({
      url: `${BASE}/news/editorial-${a.id}`,
      lastModified: new Date(a.created_at),
      changeFrequency: "never" as const,
      priority: 0.8,
    }));
  } catch {
    // Если Supabase недоступен — возвращаем хотя бы статические страницы
  }

  return [...staticPages, ...articlePages];
}
