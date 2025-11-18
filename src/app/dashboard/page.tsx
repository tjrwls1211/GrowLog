import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession().catch(() => null)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userId = session.user.id

  const posts = await prisma.post.findMany({
    where: { userId },
    include: {
      postTags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const totalPosts = posts.length
  const publicPosts = posts.filter((p: { isPublic: boolean }) => p.isPublic).length
  const privatePosts = posts.filter((p: { isPublic: boolean }) => !p.isPublic).length

  const tagCounts = new Map<string, number>()
  posts.forEach((post: { postTags: { tag: { name: string } }[] }) => {
    post.postTags.forEach((pt: { tag: { name: string } }) => {
      const count = tagCounts.get(pt.tag.name) || 0
      tagCounts.set(pt.tag.name, count + 1)
    })
  })

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentPosts = posts.filter((p: { createdAt: Date }) => p.createdAt >= sevenDaysAgo)

  return (
    <div className="mx-auto max-w-6xl py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-[var(--color-foreground)]/70">
          나의 학습 활동을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-foreground)]/70 mb-1">
                전체 글
              </p>
              <p className="text-3xl font-bold">{totalPosts}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-foreground)]/70 mb-1">
                공개 글
              </p>
              <p className="text-3xl font-bold">{publicPosts}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-foreground)]/70 mb-1">
                비공개 글
              </p>
              <p className="text-3xl font-bold">{privatePosts}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 활동 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">최근 7일 활동</h2>
            <Link href="/posts/new" className="btn btn-primary btn--sm">
              새 글 작성
            </Link>
          </div>

          {recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.slice(0, 5).map((post: { id: number; title: string; createdAt: Date; isPublic: boolean }) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card className="p-4 hover:shadow-md transition cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate hover:text-[var(--primary)] transition">
                            {post.title}
                          </h3>
                          {!post.isPublic && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-foreground)]/70 shrink-0">
                              비공개
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-foreground)]/60">
                          {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-[var(--color-foreground)]/70 mb-4">
                최근 7일간 작성한 글이 없습니다.
              </p>
              <Link href="/posts/new" className="btn btn-primary">
                글 작성하기
              </Link>
            </Card>
          )}
        </div>

        {/* 인기 태그 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">자주 사용하는 태그</h2>

          {topTags.length > 0 ? (
            <Card className="p-6">
              <div className="space-y-3">
                {topTags.map(([tagName, count], index) => (
                  <div
                    key={tagName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--color-foreground)]/50 w-6">
                        {index + 1}
                      </span>
                      <Tag className="bg-[var(--primary)]/10 text-[var(--primary)]">
                        #{tagName}
                      </Tag>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-foreground)]/70">
                      {count}개
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-[var(--color-foreground)]/70">
                아직 사용한 태그가 없습니다.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* 모든 글 목록 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">모든 글</h2>
          <Link
            href="/posts"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            전체 보기 →
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.slice(0, 10).map((post: { id: number; title: string; summary: string | null; createdAt: Date; isPublic: boolean; postTags: { id: number; tag: { name: string } }[] }) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium hover:text-[var(--primary)] transition">
                          {post.title}
                        </h3>
                        {!post.isPublic && (
                          <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-foreground)]/70 shrink-0">
                            비공개
                          </span>
                        )}
                      </div>
                      {post.summary && (
                        <p className="text-sm text-[var(--color-foreground)]/70 line-clamp-1 mb-2">
                          {post.summary}
                        </p>
                      )}
                      {post.postTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.postTags.slice(0, 3).map((pt: { id: number; tag: { name: string } }) => (
                            <Tag
                              key={pt.id}
                              className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs"
                            >
                              #{pt.tag.name}
                            </Tag>
                          ))}
                          {post.postTags.length > 3 && (
                            <span className="text-xs text-[var(--color-foreground)]/50">
                              +{post.postTags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <time
                      dateTime={post.createdAt.toISOString()}
                      className="text-xs text-[var(--color-foreground)]/60 shrink-0 ml-4"
                    >
                      {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-[var(--color-foreground)]/70 mb-4">
              아직 작성한 글이 없습니다.
            </p>
            <Link href="/posts/new" className="btn btn-primary">
              첫 글 작성하기
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
