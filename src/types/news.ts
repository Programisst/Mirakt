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
