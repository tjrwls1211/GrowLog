import { getSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import PostEditor from './PostEditor'
import { prisma } from '@/lib/prisma'

export default async function NewPostPage() {
  const session = await getSession().catch(() => null)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const existingTags = await prisma.tag.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return <PostEditor existingTags={existingTags.map(tag => tag.name)} />
}
