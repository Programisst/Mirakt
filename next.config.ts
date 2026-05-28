import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["nodemailer", "jsonwebtoken"],
  async headers() {
    return [
      {
        // JS, CSS, шрифты, картинки — генерируются с хэшем в имени, можно кэшировать вечно
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Логотип и прочие публичные файлы
        source: "/:file(.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2|woff))",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
