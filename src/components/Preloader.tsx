"use client";

import { useEffect, useState } from "react";
import { GOLD, LOGO_SRC } from "@/constants/site";

type Phase = "enter" | "hold" | "exit" | "done";

export function Preloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    // enter → hold (контент появился)
    const t1 = setTimeout(() => setPhase("hold"), 80);
    // hold → exit (начинаем прятать)
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    // exit → done (удаляем из DOM)
    const t3 = setTimeout(() => { setPhase("done"); onDone(); }, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  if (phase === "done") return null;

  const isExiting = phase === "exit";

  return (
    <div
      className="high-quality"
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        background:     "#030303",
        opacity:        isExiting ? 0 : 1,
        transform:      isExiting ? "scale(1.018)" : "scale(1)",
        transition:     isExiting ? "opacity 0.75s cubic-bezier(0.4,0,0.2,1), transform 0.75s cubic-bezier(0.4,0,0.2,1)" : "none",
        pointerEvents:  isExiting ? "none" : "all",
        userSelect:     "none",
        overflow:       "hidden",
      }}
    >
      {/* Фоновое золотое свечение за логотипом */}
      <div
        className="high-quality"
        style={{
          position:        "absolute",
          width:           320,
          height:          320,
          borderRadius:    "50%",
          background:      "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
          top:             "50%",
          left:            "50%",
          transform:       "translate(-50%, -62%)",
          pointerEvents:   "none",
          animation:       "preloaderGlow 2.8s ease-in-out infinite alternate",
        }}
      />

      {/* Логотип */}
      <div
        style={{
          width:        80,
          height:       80,
          borderRadius: "50%",
          border:       `1.5px solid ${GOLD}`,
          boxShadow:    `0 0 24px rgba(212,175,55,0.25), 0 0 56px rgba(212,175,55,0.10), inset 0 0 18px rgba(212,175,55,0.04)`,
          overflow:     "hidden",
          marginBottom: 26,
          flexShrink:   0,
          opacity:      phase === "enter" ? 0 : 1,
          transform:    phase === "enter" ? "scale(0.88) translateY(10px)" : "scale(1) translateY(0)",
          transition:   "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="Mirakt"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* Название */}
      <div
        style={{
          fontFamily:     "Inter, ui-sans-serif, sans-serif",
          fontWeight:     700,
          fontSize:       14,
          letterSpacing:  "0.52em",
          color:          GOLD,
          marginBottom:   8,
          opacity:        phase === "enter" ? 0 : 1,
          transform:      phase === "enter" ? "translateY(8px)" : "translateY(0)",
          transition:     "opacity 0.55s ease 0.12s, transform 0.55s ease 0.12s",
        }}
      >
        MIRAKT
      </div>

      {/* Подзаголовок */}
      <div
        style={{
          fontFamily:     "Inter, ui-sans-serif, sans-serif",
          fontWeight:     400,
          fontSize:       9,
          letterSpacing:  "0.30em",
          color:          "rgba(212,175,55,0.35)",
          marginBottom:   52,
          opacity:        phase === "enter" ? 0 : 1,
          transform:      phase === "enter" ? "translateY(6px)" : "translateY(0)",
          transition:     "opacity 0.55s ease 0.22s, transform 0.55s ease 0.22s",
        }}
      >
        НОВОСТНОЙ ПОРТАЛ
      </div>

      {/* Прогресс-бар */}
      <div
        style={{
          width:        160,
          height:       1,
          background:   "rgba(212,175,55,0.12)",
          borderRadius: 1,
          overflow:     "hidden",
          opacity:      phase === "enter" ? 0 : 1,
          transition:   "opacity 0.4s ease 0.3s",
        }}
      >
        <div
          className="high-quality"
          style={{
            height:          "100%",
            width:           "100%",
            background:      `linear-gradient(90deg, transparent 0%, ${GOLD} 40%, #f0d060 60%, ${GOLD} 100%)`,
            transformOrigin: "left center",
            animation:       phase !== "enter" ? "preloaderBar 2s cubic-bezier(0.25,0.46,0.45,0.94) 0.35s both" : "none",
          }}
        />
      </div>

      {/* Нижний декоративный разделитель */}
      <div
        style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          height:     1,
          background: `linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.18) 30%, rgba(212,175,55,0.18) 70%, transparent 100%)`,
        }}
      />
    </div>
  );
}
