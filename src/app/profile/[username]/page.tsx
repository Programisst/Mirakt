import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase-server";
import Link from "next/link";
import type { Metadata } from "next";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ProfilePageActions } from "@/components/ProfilePageActions";


const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} — Mirakt` };
}

function VerifiedBadge({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Верифицирован">
      <path
        fill="#1d9bf0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z" />
    </svg>
  );
}

export default async function PublicProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: profile } = await getAdminClient()
    .from("profiles")
    .select("id, username, avatar_url, verified, reads_count")
    .eq("username", username)
    .single();

  if (!profile?.username) notFound();

  const { data: { user } } = await getAdminClient().auth.admin.getUserById(profile.id);
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const initial = profile.username[0].toUpperCase();

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 mb-10 text-[11px] tracking-widest uppercase hover:opacity-70 transition-opacity"
          style={{ color: GOLD_DIM }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          К поиску
        </Link>

        {/* Profile card */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 100%)",
            border:     "1px solid rgba(212,175,55,0.15)",
          }}
        >
          {/* Glow */}
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }}
          />

          <div className="flex flex-col items-center text-center relative gap-5">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black overflow-hidden flex-shrink-0"
              style={{
                background: "rgba(212,175,55,0.1)",
                border:     "2px solid rgba(212,175,55,0.25)",
                color:      GOLD,
              }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : initial}
            </div>

            {/* Name + badge */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                  {profile.username}
                </h1>
                {profile.verified && <VerifiedBadge size={22} />}
              </div>
              {profile.verified && (
                <span
                  className="inline-block text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(29,155,240,0.1)",
                    border:     "1px solid rgba(29,155,240,0.3)",
                    color:      "rgba(29,155,240,0.9)",
                  }}
                >
                  ✓ Верифицирован
                </span>
              )}
            </div>

            {/* Online status + actions */}
            <div className="flex flex-col items-center gap-3">
              <OnlineStatus username={profile.username} />
              <ProfilePageActions targetUsername={profile.username} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)",
              border: "1px solid rgba(212,175,55,0.18)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Прочитано статей
              </div>
              <div className="text-2xl font-black" style={{ color: GOLD }}>
                {profile.username === "mirakt.news" ? "∞" : (profile.reads_count ?? 0).toLocaleString("ru-RU")}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div
          className="mt-3 rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-center justify-between py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Пользователь</span>
            <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              @{profile.username}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>На Mirakt с</span>
            <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{createdAt}</span>
          </div>
        </div>

        <p className="text-center text-[10px] mt-8" style={{ color: "rgba(255,255,255,0.1)" }}>
          © {new Date().getFullYear()} Mirakt.ru
        </p>
      </div>
    </main>
  );
}
