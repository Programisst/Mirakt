"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PresenceEntry = { username: string };

export function OnlineStatus({ username }: { username: string }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceEntry>();
        const names = Object.values(state)
          .flatMap((s) => s)
          .map((p) => p.username);
        setOnline(names.includes(username));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username]);

  return (
    <span
      className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
      style={
        online
          ? { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "rgba(74,222,128,0.8)" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }
      }
    >
      ● {online ? "Активен" : "Не активен"}
    </span>
  );
}
