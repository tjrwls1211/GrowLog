import { getSession } from "@/lib/auth-utils";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type RecentPost = Prisma.PostGetPayload<{
  include: { postTags: { include: { tag: true } } };
}>;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

function formatRelativeTime(date: Date) {
  const diff = date.getTime() - Date.now();
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
    { unit: "hour", ms: 1000 * 60 * 60 },
    { unit: "minute", ms: 1000 * 60 },
  ];

  for (const { unit, ms } of units) {
    const value = diff / ms;
    if (Math.abs(value) >= 1) {
      return relativeTimeFormatter.format(Math.round(value), unit);
    }
  }

  return "방금 전";
}

function getPostPreview(post: RecentPost) {
  const source = post.summary ?? post.content;
  const condensed = source.replace(/\s+/g, " ").trim();
  return condensed.length > 0 ? condensed : "기록된 내용이 없습니다.";
}

async function getRecentPosts(userId?: number) {
  return prisma.post.findMany({
    where: userId
      ? {
          OR: [{ isPublic: true }, { userId }],
        }
      : { isPublic: true },
    include: {
      postTags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });
}

export default async function Home() {
  const session = await getSession().catch(() => null);
  const recentPosts = await getRecentPosts(session?.user?.id);

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
          <Link href="/posts" className="text-sm text-[var(--primary)]">
            전체 보기
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {recentPosts.length === 0 ? (
            <Card className="text-center text-sm text-[var(--color-foreground)]/70">
              {session?.user ? (
                <>
                  아직 작성한 글이 없습니다.{" "}
                  <Link href="/posts/new" className="text-[var(--primary)] underline underline-offset-4">
                    첫 글 남기기
                  </Link>
                </>
              ) : (
                "아직 공개된 글이 없습니다. 곧 새로운 기록이 올라올 예정이에요."
              )}
            </Card>
          ) : (
            recentPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/posts/${post.id}`} className="block">
                      <h3 className="text-[17px] font-semibold truncate">{post.title}</h3>
                    </Link>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]/70 line-clamp-2">
                      {getPostPreview(post)}
                    </p>
                    {post.postTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.postTags.map(({ tag }) => (
                          <Tag key={`${post.id}-${tag.id}`}>#{tag.name}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-foreground)]/60">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
