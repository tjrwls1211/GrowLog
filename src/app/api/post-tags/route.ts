import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, tagId } = body

    if (!postId || !tagId) {
      return NextResponse.json(
        { error: 'postId와 tagId는 필수입니다.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 연결되어 있는지 확인
    const existingPostTag = await prisma.postTag.findUnique({
      where: {
        postId_tagId: {
          postId,
          tagId,
        },
      },
    })

    if (existingPostTag) {
      return NextResponse.json(
        { error: '이미 연결된 태그입니다.' },
        { status: 400 }
      )
    }

    const postTag = await prisma.postTag.create({
      data: {
        postId,
        tagId,
      },
    })

    return NextResponse.json(postTag, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
