"use client";

import { useEffect } from "react";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут
const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // пульс каждые 2 минуты
const LS_KEY = "mirakt_last_visit";
const LS_START = "mirakt_session_start";
const LS_VISIT_ID = "mirakt_visit_id";

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

// Пульс — обновляет "last seen" для онлайна
function sendHeartbeat() {
  const visitId = localStorage.getItem(LS_VISIT_ID);
  if (!visitId) return;
  fetch("/api/track/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitId }),
    keepalive: true,
  }).catch(() => {});
}

// Записывает длительность сессии при уходе
function sendDuration() {
  const start = Number(localStorage.getItem(LS_START) || 0);
  const visitId = localStorage.getItem(LS_VISIT_ID);
  if (!start || !visitId) return;
  const duration = Math.round((Date.now() - start) / 1000);
  if (duration < 3) return; // игнорируем менее 3 секунд
  navigator.sendBeacon("/api/track/duration", JSON.stringify({ visitId, duration }));
}

export function Tracker() {
  useEffect(() => {
    const now = Date.now();
    const last = Number(localStorage.getItem(LS_KEY) || 0);
    const isNewSession = now - last > SESSION_TIMEOUT;

    if (!isNewSession) {
      // Не новая сессия — только шлём пульс
      const hb = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
      window.addEventListener("beforeunload", sendDuration);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") sendDuration();
      });
      return () => {
        clearInterval(hb);
        window.removeEventListener("beforeunload", sendDuration);
      };
    }

    // Новая сессия — трекаем
    localStorage.setItem(LS_KEY, String(now));
    localStorage.setItem(LS_START, String(now));

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || "",
        ua: navigator.userAgent,
        source: getSource(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.visitId) localStorage.setItem(LS_VISIT_ID, d.visitId);
      })
      .catch(() => {});

    // Пульс каждые 2 мин для онлайна
    const hb = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Записываем время при уходе
    window.addEventListener("beforeunload", sendDuration);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendDuration();
    });

    return () => {
      clearInterval(hb);
      window.removeEventListener("beforeunload", sendDuration);
    };
  }, []);

  return null;
}
