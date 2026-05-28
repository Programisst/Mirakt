import jwt from "jsonwebtoken";

// ── In-memory code store (resets on server restart — fine for this scale) ─────
interface CodeEntry { code: string; expiresAt: number; attempts: number; }
const codeStore = new Map<string, CodeEntry>();

const JWT_SECRET =
  process.env.JWT_SECRET ?? "omninews-default-secret-change-in-prod-2026";

// ── Code generation ────────────────────────────────────────────────────────────
export function generateCode(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

export function storeCode(email: string, code: string): void {
  codeStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
    attempts: 0,
  });
}

export function verifyCode(email: string, code: string): "ok" | "invalid" | "expired" | "max_attempts" {
  const key = email.toLowerCase();
  const entry = codeStore.get(key);
  if (!entry) return "invalid";
  if (Date.now() > entry.expiresAt) { codeStore.delete(key); return "expired"; }
  if (entry.attempts >= 5) return "max_attempts";

  if (entry.code !== code) {
    entry.attempts += 1;
    return "invalid";
  }

  codeStore.delete(key); // single-use
  return "ok";
}

// ── JWT session ────────────────────────────────────────────────────────────────
export function createSession(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
}

export function decodeSession(token: string): { email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string };
  } catch {
    return null;
  }
}
