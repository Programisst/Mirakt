"use client";

import { useState } from "react";
import { FriendButton } from "@/components/FriendButton";
import { ChatModal } from "@/components/ChatModal";

const GOLD = "rgba(212,175,55,0.85)";

export function ProfilePageActions({ targetUsername }: { targetUsername: string }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <FriendButton targetUsername={targetUsername} />

        <button
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity"
          style={{
            background: "rgba(212,175,55,0.08)",
            border: `1px solid rgba(212,175,55,0.25)`,
            color: GOLD,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Написать
        </button>
      </div>

      {chatOpen && (
        <ChatModal onClose={() => setChatOpen(false)} initialUsername={targetUsername} />
      )}
    </>
  );
}
