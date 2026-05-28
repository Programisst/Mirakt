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

export interface CryptoPrices {
  btc: number;
  eth: number;
  sol: number;
  xrp: number;
}

export interface AuthUser {
  email: string;
  avatar_url?: string | null;
  username?: string | null;
  verified?: boolean;
}
