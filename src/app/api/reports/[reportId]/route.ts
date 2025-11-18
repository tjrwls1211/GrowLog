import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const reportId = parseInt(params.reportId, 10)

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: '유효하지 않은 리포트 ID입니다.' },
        { status: 400 }
      )
    }

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: '리포트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    return NextResponse.json(report, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const reportId = parseInt(params.reportId, 10)

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: '유효하지 않은 리포트 ID입니다.' },
        { status: 400 }
      )
    }

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: '리포트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    await prisma.report.delete({
      where: {
        id: reportId,
      },
    })

    return NextResponse.json(
      { message: '리포트가 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
