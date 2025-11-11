import Link from "next/link";
import { getSession } from "@/lib/auth-utils";
import Logo from "@/components/Logo";

export default async function Header() {
  const session = await getSession().catch(() => null);

  return (
    <header className="sticky top-0 z-40 bg-[var(--background)]/70 backdrop-blur border-b border-[var(--color-border)]">
      <div className="w-full h-16 flex items-center justify-between px-6 md:px-20">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="GrowLog Home"
            style={{ color: 'var(--color-foreground)' }}
          >
            <Logo hideIcon />
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/" style={{ color: 'var(--color-foreground)' }}>홈</Link>
            <Link href="/posts" style={{ color: 'var(--color-foreground)' }}>글</Link>
            <Link href="/dashboard" style={{ color: 'var(--color-foreground)' }}>대시보드</Link>
            <Link href="/reports" style={{ color: 'var(--color-foreground)' }}>AI 리포트</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user?.name ?? "profile"}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-black/10" />
              )}
              <form action="/api/auth/signout" method="POST">
                <button className="btn btn-outline btn--md">로그아웃</button>
              </form>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="btn btn-outline btn--md"
              style={{ background: 'var(--background)', color: 'var(--color-primary)' }}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
