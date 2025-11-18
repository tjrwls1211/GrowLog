import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import PostEditor from '@/app/posts/new/PostEditor'

export const dynamic = 'force-dynamic';

type EditPostPageProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await getSession().catch(() => null)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { postId: postIdStr } = await params
  const postId = parseInt(postIdStr, 10)

  if (isNaN(postId)) {
    notFound()
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
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

  if (post.userId !== session.user.id) {
    redirect(`/posts/${postId}`)
  }

  const existingTags = await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <PostEditor
      existingTags={existingTags.map(tag => tag.name)}
      initialData={{
        id: post.id,
        title: post.title,
        content: post.content,
        isPublic: post.isPublic,
        tags: post.postTags.map(pt => pt.tag.name),
      }}
    />
  )
}
