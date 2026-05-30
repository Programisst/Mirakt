"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CategoryId } from "@/constants/categories";
import { GOLD } from "@/constants/site";
import { getThematicImg } from "@/lib/thematic-image";
import { timeAgo } from "@/lib/time-ago";
import type { NewsItem } from "@/types/news";

export function NewsCard({
  item,
  featured,
  category,
  fill,
  eager,
}: {
  item: NewsItem;
  featured?: boolean;
  category: CategoryId;
  fill?: boolean;
  eager?: boolean;
}) {
  const thematic = getThematicImg(category);
  const initialSrc = item.thumbnail || thematic;

  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(item.thumbnail || thematic);
  }, [item.id, thematic]);

  const stretchCard = featured || fill;

  const articleHref = item.mirakt_slug
    ? `/novosti/${item.mirakt_slug}`
    : `/news/${encodeURIComponent(item.id)}?d=${encodeURIComponent(JSON.stringify(item))}`;

  return (
    <Link
      href={articleHref}
      className={`group rounded-xl overflow-hidden ${stretchCard ? "flex flex-col h-full" : "block"}`}
      style={{
        background: "rgba(14,11,7,0.96)",
        border:     "1px solid rgba(255,255,255,0.07)",
        boxShadow:  "0 1px 12px rgba(0,0,0,0.5)",
        transition: "transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform   = "translateY(-3px)";
        el.style.boxShadow   = "0 0 0 1px rgba(212,175,55,0.28), 0 12px 36px rgba(0,0,0,0.6)";
        el.style.borderColor = "rgba(212,175,55,0.28)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform   = "";
        el.style.boxShadow   = "0 1px 12px rgba(0,0,0,0.5)";
        el.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div
        className="relative overflow-hidden"
        style={stretchCard
          ? { flex: "1 1 auto", minHeight: 80, background: "#0c0a06" }
          : { height: 172, background: "#0c0a06" }
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          loading={eager ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgSrc(thematic)}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${featured ? "from-[#0e0c08]/90 via-[#0e0c08]/30 to-transparent" : "from-[#0e0c08]/70 via-transparent to-transparent"}`} />
      </div>
      <div className={`flex flex-col gap-2 ${featured ? "p-5" : "p-4"}`}>
        {item.source && (
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.22em] uppercase" style={{ color: "rgba(212,175,55,0.7)" }}>
            <span style={{ width: 12, height: 1, background: "rgba(212,175,55,0.5)", display: "inline-block" }} />
            {item.source}
          </span>
        )}
        <h3
          className={`leading-snug text-white/88 group-hover:text-white transition-colors ${featured ? "text-[15px] sm:text-[16px] font-bold" : "text-[13px] font-semibold"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {item.title}
        </h3>
        {item.description && !featured && (
          <p className="text-[11px] text-white/35 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        {item.description && featured && (
          <p className="text-[12px] text-white/40 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-white/18">{timeAgo(item.pubDate)}</span>
          <span
            className="text-[9px] font-semibold tracking-[0.14em] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: GOLD }}
          >
            ЧИТАТЬ →
          </span>
        </div>
      </div>
    </Link>
  );
}
