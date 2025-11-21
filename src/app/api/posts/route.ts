import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendSummaryJobWithRetry } from '@/lib/azure-queue'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const posts = await prisma.post.findMany({
      where: session?.user
        ? {
            OR: [
              { isPublic: true },
              { userId: session.user.id },
            ],
          }
        : { isPublic: true },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(posts, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

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
    const { title, content, isPublic = false } = body

    if (!title) {
      return NextResponse.json(
        { error: '제목은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: '내용은 필수입니다.' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        summary: null,
        summaryStatus: 'PENDING',
        isPublic,
        userId: session.user.id,
      },
    })

    try {
      await sendSummaryJobWithRetry(post.id)
    } catch (queueError) {
      console.error('[Posts] Queue 전송 실패:', queueError)
      await prisma.post.update({
        where: { id: post.id },
        data: { summaryStatus: 'FAILED' },
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
