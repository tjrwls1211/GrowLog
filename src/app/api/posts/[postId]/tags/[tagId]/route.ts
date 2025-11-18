import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string; tagId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { postId: postIdStr, tagId: tagIdStr } = await params
    const postId = parseInt(postIdStr)
    const tagId = parseInt(tagIdStr)

    if (isNaN(postId) || isNaN(tagId)) {
      return NextResponse.json(
        { error: '잘못된 ID 형식입니다.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const postTag = await prisma.postTag.findUnique({
      where: {
        postId_tagId: {
          postId,
          tagId,
        },
      },
    })

    if (!postTag) {
      return NextResponse.json(
        { error: '연결된 태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.postTag.delete({
      where: {
        postId_tagId: {
          postId,
          tagId,
        },
      },
    })

    return NextResponse.json(
      { message: '태그가 제거되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
