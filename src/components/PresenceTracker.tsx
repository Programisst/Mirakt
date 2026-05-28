"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function PresenceTracker() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      if (!profile?.username) return;

      channel = supabase.channel("online-users");
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel!.track({ username: profile.username });
        }
      });
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
