"use client";

import { useEffect } from "react";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут
const LS_KEY = "mirakt_last_visit";

function getSource(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source") || params.get("ref") || "";
  if (utm) return utm;
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace("www.", "");
    if (host.includes("yandex")) return "yandex";
    if (host.includes("google")) return "google";
    if (host.includes("vk.com")) return "vkontakte";
    if (host.includes("t.me") || host.includes("telegram")) return "telegram";
    if (host.includes("ok.ru")) return "odnoklassniki";
    return host;
  } catch { return "direct"; }
}

export function Tracker() {
  useEffect(() => {
    const now = Date.now();
    const last = Number(localStorage.getItem(LS_KEY) || 0);
    const isNewSession = now - last > SESSION_TIMEOUT;

    if (!isNewSession) return;

    localStorage.setItem(LS_KEY, String(now));

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || "",
        ua: navigator.userAgent,
        source: getSource(),
      }),
    }).catch(() => {});
  }, []);

  return null;
}
