import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Tracker } from "@/components/Tracker";
import { PresenceTracker } from "@/components/PresenceTracker";

const BASE_URL = "https://mirakt.ru";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Mirakt — новостной портал: актуальные новости России, Крыма, экономики и политики",
    template: "%s | Mirakt",
  },

  description:
    "Mirakt — новостной портал России. Актуальные новости страны, политики, экономики и мира в реальном времени. Свежие события, аналитика и обзоры из надёжных источников.",

  keywords: [
    "новости Крыма", "крымские новости", "новости Симферополя", "новости Севастополя",
    "новости Ялты", "Крым сегодня", "Крым новости сегодня",
    "новости", "Россия", "Крым", "экономика", "политика",
    "актуальные новости", "новостной портал", "Mirakt", "мирakt",
    "Крымский полуостров", "РК новости",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: BASE_URL,
    siteName: "Mirakt",
    title: "Mirakt — новостной портал: актуальные новости России, Крыма, экономики и политики",
    description:
      "Mirakt — новостной портал. Актуальные новости России, Крыма, экономики, политики и мира в реальном времени.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mirakt — новостной портал",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mirakt — новостной портал: актуальные новости России, Крыма, экономики и политики",
    description:
      "Mirakt — новостной портал. Актуальные новости России, Крыма, экономики, политики и мира в реальном времени.",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: BASE_URL,
  },

  verification: {
    yandex: "1c41e500f6823379",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="Mirakt RSS" href="/rss.xml" />
        <link rel="apple-touch-icon" href="/mirakt-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mirakt" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#08070a" />
        {/* Региональная привязка к Крыму для Яндекса */}
        <meta name="geo.region" content="RU-CR" />
        <meta name="geo.placename" content="Крым" />
        <meta name="geo.position" content="45.0;34.0" />
        <meta name="ICBM" content="45.0, 34.0" />
        <Script src="https://plausible.io/js/pa-qQ0QWYiU5HcryEyk-Vxxu.js" strategy="afterInteractive" />
        <Script id="plausible-init" strategy="afterInteractive">{`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}</Script>
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Tracker />
        <PresenceTracker />
        {children}
      </body>
    </html>
  );
}
