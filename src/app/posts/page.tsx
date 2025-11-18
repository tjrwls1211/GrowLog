import { getSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const session = await getSession().catch(() => null)
  const userId = session?.user?.id

  const posts = await prisma.post.findMany({
    where: userId
      ? {
          OR: [
            { isPublic: true },
            { userId, isPublic: false },
          ],
        }
      : { isPublic: true },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
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

  return (
    <div className="mx-auto max-w-4xl py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">학습 기록</h1>
          <p className="text-[var(--color-foreground)]/70">
            공유된 학습 내용을 둘러보세요
          </p>
        </div>
        {session && (
          <Link href="/posts/new" className="btn btn-primary">
            새 글 작성
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[var(--color-foreground)]/70 mb-4">
            아직 작성된 글이 없습니다.
          </p>
          {session && (
            <Link href="/posts/new" className="btn btn-primary">
              첫 글 작성하기
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isOwner = userId === post.userId

            return (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-semibold hover:text-[var(--primary)] transition">
                          {post.title}
                        </h2>
                        {!post.isPublic && isOwner && (
                          <span className="text-xs px-2 py-1 rounded bg-[var(--color-surface)] text-[var(--color-foreground)]/70">
                            비공개
                          </span>
                        )}
                      </div>
                      {post.summary && (
                        <p className="text-[var(--color-foreground)]/70 text-sm line-clamp-2 mb-3">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {post.postTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.postTags.map((pt) => (
                        <Tag
                          key={pt.id}
                          className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs"
                        >
                          #{pt.tag.name}
                        </Tag>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--color-foreground)]/60">
                    <div className="flex items-center gap-2">
                      {post.user.image && (
                        <img
                          src={post.user.image}
                          alt={post.user.name || ''}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <span>{post.user.name}</span>
                    </div>
                    <time dateTime={post.createdAt.toISOString()}>
                      {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
