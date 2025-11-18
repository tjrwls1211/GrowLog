import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import MarkdownRenderer from '@/components/MarkdownRenderer'

type PostDetailPageProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId: postIdStr } = await params
  const postId = parseInt(postIdStr, 10)

  if (isNaN(postId)) {
    notFound()
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      postTags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  const session = await getSession().catch(() => null)
  const isAuthor = session?.user?.id === post.userId

  if (!post.isPublic && !isAuthor) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            접근 권한이 없습니다
          </h1>
          <p className="mt-4 text-[var(--color-foreground)]/70">
            이 글은 비공개 상태입니다. 작성자만 볼 수 있습니다.
          </p>
          <Link href="/" className="btn btn-primary mt-6 inline-flex">
            홈으로 돌아가기
          </Link>
        </Card>
      </div>
    )
  }

  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(post.createdAt))

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-[var(--color-foreground)]/70 hover:text-[var(--primary)] transition"
        >
          ← 목록으로
        </Link>
        {isAuthor && (
          <div className="flex gap-2">
            <Link
              href={`/posts/${post.id}/edit`}
              className="btn btn-outline btn--sm"
            >
              수정
            </Link>
            <button
              type="button"
              className="btn btn-outline btn--sm text-red-600 border-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {!post.isPublic && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                  비공개
                </span>
              )}
              {post.isPublic && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  공개
                </span>
              )}
              <span className="text-sm text-[var(--color-foreground)]/60">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
              {post.title}
            </h1>

            <p className="mt-2 text-sm text-[var(--color-foreground)]/70">
              작성자: {post.user.name || post.user.email}
            </p>
          </div>

          {post.postTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.postTags.map(({ tag }) => (
                <Tag key={tag.id} className="bg-[var(--primary)]/10 text-[var(--primary)]">
                  #{tag.name}
                </Tag>
              ))}
            </div>
          )}

          <hr className="border-[var(--color-border)]" />

          <MarkdownRenderer content={post.content} />
        </div>
      </Card>
    </div>
  )
}
