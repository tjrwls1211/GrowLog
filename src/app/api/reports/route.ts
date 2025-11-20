import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateMonthlyReportStream } from '@/lib/gemini'

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

    return NextResponse.json({ reports }, { status: 200 })
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

    const { success, resetTime } = checkRateLimit(session.user.id)
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

    const userId = session.user.id
    const postCount = posts.length

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        let reportId: number | null = null

        try {
          const report = await prisma.report.create({
            data: {
              userId,
              content: '',
              postCount,
              periodType: 'MONTHLY',
              status: 'COMPLETED',
            },
          })
          reportId = report.id

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'id', reportId })}\n\n`))

          for await (const chunk of generateMonthlyReportStream(posts)) {
            fullContent += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
          }

          if (reportId) {
            await prisma.report.update({
              where: { id: reportId },
              data: { content: fullContent },
            })
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`))
        } catch (error) {
          console.error('[Reports] Streaming error:', error)

          if (reportId) {
            await prisma.report.update({
              where: { id: reportId },
              data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
              },
            })
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: '리포트 생성에 실패했습니다.' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
