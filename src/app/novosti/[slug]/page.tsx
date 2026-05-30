import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { ArticlePage } from "./ArticlePage";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  published_at: string;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getArticle(slug: string): Promise<Article | null> {
  const { data } = await db()
    .from("articles")
    .select("id,slug,title,excerpt,content,image_url,category,published_at")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Новость | Mirakt" };

  const url = `https://mirakt.ru/novosti/${slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.excerpt,
      siteName: "Mirakt",
      publishedTime: article.published_at,
      images: article.image_url ? [{ url: article.image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default async function NovostitSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    image: article.image_url ? [article.image_url] : [],
    author: { "@type": "Organization", name: "Редакция Mirakt", url: "https://mirakt.ru" },
    publisher: {
      "@type": "Organization",
      name: "Mirakt",
      url: "https://mirakt.ru",
      logo: { "@type": "ImageObject", url: "https://mirakt.ru/image%20copy.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://mirakt.ru/novosti/${slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticlePage article={article} />
    </>
  );
}
