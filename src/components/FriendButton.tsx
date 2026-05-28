"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const GOLD = "rgba(212,175,55,0.85)";

type Status = null | "self" | "pending_sent" | "pending_received" | "accepted" | "loading";

async function authHeader(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? `Bearer ${token}` : null;
}

export function FriendButton({ targetUsername }: { targetUsername: string }) {
  const [status, setStatus]   = useState<Status>("loading");
  const [rowId, setRowId]     = useState<string | null>(null);
  const [busy, setBusy]       = useState(false);

  async function load() {
    const auth = await authHeader();
    if (!auth) { setStatus(null); return; }
    const res = await fetch(`/api/friends/status?username=${encodeURIComponent(targetUsername)}`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) { setStatus(null); return; }
    const d = await res.json();
    setStatus(d.status ?? null);
    setRowId(d.id ?? null);
  }

  useEffect(() => { load(); }, [targetUsername]);

  async function sendRequest() {
    setBusy(true);
    const auth = await authHeader();
    if (!auth) { setBusy(false); return; }
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ target_username: targetUsername }),
    });
    if (res.ok) {
      const d = await res.json();
      setRowId(d.id);
      setStatus("pending_sent");
    }
    setBusy(false);
  }

  async function cancel() {
    if (!rowId) return;
    setBusy(true);
    const auth = await authHeader();
    if (!auth) { setBusy(false); return; }
    await fetch(`/api/friends/${rowId}`, { method: "DELETE", headers: { Authorization: auth } });
    setStatus(null);
    setRowId(null);
    setBusy(false);
  }

  async function respond(action: "accept" | "reject") {
    if (!rowId) return;
    setBusy(true);
    const auth = await authHeader();
    if (!auth) { setBusy(false); return; }
    await fetch(`/api/friends/${rowId}`, {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (action === "accept") setStatus("accepted");
    else { setStatus(null); setRowId(null); }
    setBusy(false);
  }

  if (status === "loading" || status === "self") return null;

  // Not logged in
  if (status === null) {
    return (
      <button
        onClick={sendRequest}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all hover:opacity-80 disabled:opacity-40"
        style={{
          background: "rgba(212,175,55,0.12)",
          border: "1px solid rgba(212,175,55,0.35)",
          color: GOLD,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        {busy ? "..." : "Добавить в друзья"}
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Заявка отправлена
        </span>
        <button
          onClick={cancel} disabled={busy}
          className="px-3 py-2.5 rounded-xl text-[11px] transition-all hover:opacity-70 disabled:opacity-40"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
        >
          {busy ? "..." : "Отменить"}
        </button>
      </div>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] mr-1" style={{ color: "rgba(255,255,255,0.3)" }}>Хочет дружить</span>
        <button
          onClick={() => respond("accept")} disabled={busy}
          className="px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}
        >
          {busy ? "..." : "Принять"}
        </button>
        <button
          onClick={() => respond("reject")} disabled={busy}
          className="px-4 py-2.5 rounded-xl text-[12px] transition-all hover:opacity-70 disabled:opacity-40"
          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.55)" }}
        >
          {busy ? "..." : "Отклонить"}
        </button>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "rgba(74,222,128,0.8)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          В друзьях
        </span>
        <button
          onClick={cancel} disabled={busy}
          className="px-3 py-2.5 rounded-xl text-[11px] transition-all hover:opacity-70 disabled:opacity-40"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}
        >
          {busy ? "..." : "Удалить"}
        </button>
      </div>
    );
  }

  return null;
}
