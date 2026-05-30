export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
  content?: string;
  editorial?: boolean;
  mirakt_slug?: string; // set for Mirakt-authored articles → links to /novosti/[slug]
}

export interface MirakcArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  published_at: string;
}

export interface CurrencyRates {
  usd: number | null;
  eur: number | null;
  cny: number | null;
  try: number | null;
  aed: number | null;
}

export interface AuthUser {
  email: string;
  avatar_url?: string | null;
  username?: string | null;
  verified?: boolean;
}
