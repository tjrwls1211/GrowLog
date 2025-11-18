import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateMonthlyReport } from '@/lib/gemini'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const reports = await prisma.report.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reports, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { success, remaining, resetTime } = checkRateLimit(session.user.id)
    if (!success) {
      const resetDate = new Date(resetTime)
      return NextResponse.json(
        {
          error: '요청 한도를 초과했습니다.',
          resetTime: resetDate.toISOString(),
        },
        { status: 429 }
      )
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const posts = await prisma.post.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
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

    if (posts.length === 0) {
      return NextResponse.json(
        { error: '이번 달에 작성된 포스트가 없습니다.' },
        { status: 400 }
      )
    }

    const content = await generateMonthlyReport(posts)

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        content,
        postCount: posts.length,
        periodType: 'MONTHLY',
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
