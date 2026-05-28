"use client";

import { useEffect } from "react";

export function Tracker() {
  useEffect(() => {
    if (sessionStorage.getItem("tracked")) return;
    sessionStorage.setItem("tracked", "1");
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: window.location.pathname,
        referrer: document.referrer || "",
        ua: navigator.userAgent,
      }),
    }).catch(() => {});
  }, []);

  return null;
}
