import type { Metadata } from "next";
import { ArticleClient } from "./ArticleClient";
import type { NewsItem } from "@/types/news";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ d?: string }>;
}

function parseItem(raw: string | undefined): NewsItem | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as NewsItem;
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const item = parseItem(params.d);

  if (!item) return { title: "Новость | Mirakt" };

  const desc = item.description?.slice(0, 160) || item.title;
  const canonical = `https://mirakt.ru/news/${encodeURIComponent(item.id)}`;

  return {
    title: item.title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: item.title,
      description: desc,
      images: item.thumbnail ? [{ url: item.thumbnail, width: 1200, height: 630 }] : [],
      publishedTime: item.pubDate,
      siteName: "Mirakt",
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: desc,
      images: item.thumbnail ? [item.thumbnail] : [],
    },
  };
}

export default async function NewsArticlePage({ searchParams }: Props) {
  const params = await searchParams;
  const item = parseItem(params.d);

  const jsonLd = item
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: item.title,
        description: item.description?.slice(0, 160) || item.title,
        image: item.thumbnail ? [item.thumbnail] : [],
        datePublished: item.pubDate,
        url: item.link,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://mirakt.ru/news/${encodeURIComponent(item.id)}`,
        },
        publisher: {
          "@type": "Organization",
          name: "Mirakt",
          url: "https://mirakt.ru",
          logo: {
            "@type": "ImageObject",
            url: "https://mirakt.ru/mirakt-icon.png",
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleClient initialItem={item} />
    </>
  );
}
