import type { CategoryId } from "@/constants/categories";

/**
 * Тематическая заглушка — inline SVG (data URI).
 * Ничего не грузится с диска, никакие файлы не нужны.
 * Один жёсткий рисунок на категорию — никакого перетекания между вкладками.
 */

const PALETTE: Record<CategoryId, { from: string; to: string; label: string }> = {
  main:     { from: "#0a0806", to: "#1a1208", label: "MIRAKT"    },
  world:    { from: "#050810", to: "#0b1830", label: "WORLD"     },
  russia:   { from: "#0a0605", to: "#2a0a08", label: "RUSSIA"    },
  crimea:   { from: "#050a0c", to: "#082028", label: "CRIMEA"    },
  economy:  { from: "#080803", to: "#261d05", label: "ECONOMY"   },
  science:  { from: "#06080a", to: "#0a1a24", label: "SCIENCE"   },
  politics: { from: "#080503", to: "#1f0c03", label: "POLITICS"  },
};

function buildSvg(from: string, to: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${from}'/>
      <stop offset='1' stop-color='${to}'/>
    </linearGradient>
    <pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'>
      <path d='M0 40L40 0' stroke='rgba(212,175,55,0.06)' stroke-width='1'/>
    </pattern>
  </defs>
  <rect width='800' height='450' fill='url(#g)'/>
  <rect width='800' height='450' fill='url(#p)'/>
  <text x='400' y='232' fill='rgba(212,175,55,0.55)' font-family='Inter, system-ui, sans-serif' font-size='44' font-weight='900' letter-spacing='12' text-anchor='middle'>${label}</text>
  <line x1='320' y1='262' x2='480' y2='262' stroke='rgba(212,175,55,0.35)' stroke-width='1'/>
</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const THEME_IMG: Record<CategoryId, string> = (Object.keys(PALETTE) as CategoryId[]).reduce(
  (acc, cat) => {
    const { from, to, label } = PALETTE[cat];
    acc[cat] = buildSvg(from, to, label);
    return acc;
  },
  {} as Record<CategoryId, string>
);

export function getThematicImg(category: CategoryId): string {
  return THEME_IMG[category] ?? THEME_IMG.main;
}
