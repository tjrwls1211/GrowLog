import { getSession } from "@/lib/auth-utils";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

export default async function Home() {
  const session = await getSession().catch(() => null);

  return (
    <div className="space-y-10">
      <section className="text-center pt-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
          나만의 꾸준한 학습 로그, GrowLog
        </h1>
        <p className="mt-3 text-[var(--color-foreground)]/80">
          글로 학습을 기록하고, 태그/패턴 분석과 AI 리포트로 성장의 방향을 확인하세요.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          {session ? (
            <>
              <Link href="/posts/new" className="btn btn-primary btn--lg">
                새 글 쓰기
              </Link>
              <Link href="/dashboard" className="btn btn-outline btn--lg">
                대시보드 보기
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-primary btn--lg">
                시작하기
              </Link>
              <Link href="/posts" className="btn btn-outline btn--lg">
                글 둘러보기
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">최근 글</h2>
          <Link href="/posts" className="text-sm text-[var(--primary)]">전체 보기</Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* TODO: 실제 POST 데이터로 교체 해야함 - 임시 */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href="#" className="block">
                    <h3 className="text-[17px] font-semibold truncate">
                      예시 포스트 제목 {i}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]/70 line-clamp-2">
                    내용 예시입니다. Markdown 본문 중 일부가 요약되어 보입니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Tag>#javascript</Tag>
                    <Tag>#cs</Tag>
                    <Tag>#til</Tag>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-foreground)]/60">
                  방금 전
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
