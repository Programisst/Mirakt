import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { isCleanNewsText } from "@/lib/content-filter";

type MediaNode =
  | { $?: { url?: string; medium?: string; type?: string } }
  | Array<{ $?: { url?: string; medium?: string; type?: string } }>
  | undefined;

type CustomItem = {
  "media:content"?: MediaNode;
  "media:thumbnail"?: MediaNode;
  "media:group"?: { "media:content"?: MediaNode; "media:thumbnail"?: MediaNode };
  "content:encoded"?: string;
  "itunes:image"?: { $?: { href?: string } } | string;
  image?: { url?: string } | string;
  /** Стандартный rss-parser enclosure: { url, type, length } */
  enclosure?: { url?: string; length?: string; type?: string };
  /** Raw xml2js enclosure для фидов типа TASS с <enclosure ...></enclosure> */
  enc_raw?: Array<{ $?: { url?: string; type?: string; length?: string } }>;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["media:group", "media:group"],
      ["content:encoded", "content:encoded"],
      ["itunes:image", "itunes:image"],
      ["image", "image"],
      ["enclosure", "enc_raw", { keepArray: true }],
    ],
  },
  timeout: 25_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; OmniNewsBot/1.0; +https://omninews.ru)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

/** Возвращает true если URL не является очевидным мусором. */
function isReal(raw: string): boolean {
  let u = raw;
  if (u.startsWith("//")) u = "https:" + u;
  if (!/^https?:\/\//i.test(u)) return false;
  if (/^data:/i.test(u)) return false;
  if (/\.svg(\?|#|$)/i.test(u)) return false;
  if (/\.gif(\?|#|$)/i.test(u)) return false;
  if (/placeholder|spacer|tracking|tracker|pixel|noimage|no.image/i.test(u)) return false;
  // Брендовые/дефолтные OG-картинки сайтов (не статейные фото)
  if (/_og\./i.test(u)) return false;
  // Бандлированные веб-ресурсы (webpack, static bundles)
  if (/\/assets\/webpack\//i.test(u)) return false;
  if (u.length < 20) return false;
  return true;
}

/**
 * Извлекает первый нормальный URL изображения из HTML-фрагмента.
 * Приоритет: data-src > src > srcset. Проходит все <img>, берёт первый валидный.
 */
function extractImg(html: string): string {
  if (!html) return "";

  const getAttr = (tag: string, name: string): string => {
    const re = new RegExp(
      "\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')",
      "i"
    );
    const m = tag.match(re);
    return (m?.[1] ?? m?.[2] ?? "").trim();
  };

  const imgTagRe = /<img\s[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = imgTagRe.exec(html)) !== null) {
    const tag = tagMatch[0];

    const srcsetRaw = getAttr(tag, "srcset");
    const srcsetUrl = srcsetRaw
      ? srcsetRaw.split(",")[0].trim().split(/\s+/)[0]
      : "";

    const candidates = [
      getAttr(tag, "data-src"),
      getAttr(tag, "src"),
      srcsetUrl,
    ];

    for (let u of candidates) {
      if (!u) continue;
      if (u.startsWith("//")) u = "https:" + u;
      if (isReal(u)) return u;
    }
  }

  return "";
}

/**
 * Загружает страницу статьи и извлекает og:image или twitter:image.
 * Используется только если thumbnail не найден в RSS.
 * Таймаут 4 сек, читаем только первые 50 KB (мета-теги всегда в <head>).
 */
async function fetchOgImage(pageUrl: string): Promise<string> {
  if (!pageUrl || pageUrl === "#") return "";
  try {
    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), 6_000);
    let html: string;
    try {
      const res = await fetch(pageUrl, {
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OmniNewsBot/1.0; +https://omninews.ru)",
        },
      });
      if (!res.ok) return "";
      // Читаем только первые 50 KB через стриминг — не ждём весь файл (страницы бывают 1MB+)
      const MAX = 50_000;
      const chunks: Uint8Array[] = [];
      let total = 0;
      const reader = res.body?.getReader();
      if (reader) {
        try {
          while (total < MAX) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            const slice = value.slice(0, MAX - total);
            chunks.push(slice);
            total += slice.length;
          }
        } finally {
          reader.cancel().catch(() => {});
        }
      }
      const merged = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { merged.set(c, off); off += c.length; }
      html = new TextDecoder().decode(merged);
    } finally {
      clearTimeout(abortTimer);
    }

    // og:image и twitter:image — атрибуты могут идти в любом порядке
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) {
        let u = m[1].trim();
        if (u.startsWith("//")) u = "https:" + u;
        if (isReal(u)) return u;
      }
    }

    return "";
  } catch {
    return "";
  }
}

/** Pull a URL out of a media:* node (single, array, or nested media:group). */
function pickMediaUrl(node: MediaNode): string {
  if (!node) return "";
  const arr = Array.isArray(node) ? node : [node];
  for (const n of arr) {
    const url = n?.$?.url;
    if (!url) continue;
    const medium = n?.$?.medium;
    const type = n?.$?.type;
    if (medium && medium !== "image") continue;
    if (type && !type.startsWith("image/")) continue;
    return url;
  }
  return "";
}

/** Минимальная проверка: просто https?:// URL. */
function isHttpUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim());
}

function stripHtml(s: string): string {
  return (s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-zA-Z#\d]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "No URL" }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);

    // Async map: для статей без thumbnail дополнительно фетчим og:image
    const rawItems = await Promise.all(
      (feed.items ?? []).map(async (item, i) => {
        const group = item["media:group"];

        // Enclosure: стандартный rss-parser {url,type} или raw xml2js [{$:{url,type}}] (TASS)
        const enclosureUrl = (() => {
          // Стандартный rss-parser формат (lenta.ru, interfax.ru, gazeta.ru...)
          const std = item.enclosure;
          if (std?.url && (!std.type || std.type.startsWith("image/"))) return std.url;
          // xml2js attribute-object формат (TASS): [{$:{url,type,length}}]
          for (const n of item.enc_raw ?? []) {
            const a = n.$;
            if (a?.url && (!a.type || a.type.startsWith("image/"))) return a.url;
          }
          return "";
        })();

        const itunes = item["itunes:image"];
        const itunesUrl =
          typeof itunes === "string" ? itunes : itunes?.$?.href ?? "";

        const imageField = item.image;
        const imageFieldUrl =
          typeof imageField === "string"
            ? imageField
            : imageField?.url ?? "";

        const candidates: string[] = [
          // 1. media-поля
          pickMediaUrl(item["media:content"]),
          pickMediaUrl(item["media:thumbnail"]),
          pickMediaUrl(group?.["media:content"]),
          pickMediaUrl(group?.["media:thumbnail"]),
          enclosureUrl,
          itunesUrl,
          imageFieldUrl,
          // 2. <img> из HTML-контента
          extractImg(item["content:encoded"] ?? ""),
          extractImg(item.content ?? ""),
          extractImg(item.summary ?? ""),
          extractImg((item as { description?: string }).description ?? ""),
        ];

        let thumbnail = candidates.find(isReal) ?? "";

        // 3. Финальный fallback: og:image / twitter:image со страницы статьи
        if (!thumbnail && item.link && item.link !== "#") {
          thumbnail = await fetchOgImage(item.link);
        }

        const title = stripHtml(item.title ?? "");
        const description = stripHtml(
          item.contentSnippet ?? item.summary ?? item.content ?? ""
        ).slice(0, 280);
        if (!isCleanNewsText(title, description)) return null;
        // Статьи без картинки не показываем — они дают fallback-плейсхолдер категории
        if (!thumbnail) return null;

        return {
          id: `${url}::${i}::${item.pubDate ?? item.isoDate ?? i}`,
          title,
          description,
          link: item.link ?? "#",
          pubDate: item.pubDate ?? item.isoDate ?? "",
          thumbnail,
          source: feed.title ?? "",
        };
      })
    );

    const items = rawItems.filter(Boolean) as Array<{
      id: string;
      title: string;
      description: string;
      link: string;
      pubDate: string;
      thumbnail: string;
      source: string;
    }>;

    return NextResponse.json(
      { status: "ok", items, feedTitle: feed.title ?? "" },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    console.error("[api/feed] Error fetching", url, e);
    return NextResponse.json({ status: "error", items: [] }, { status: 200 });
  }
}
