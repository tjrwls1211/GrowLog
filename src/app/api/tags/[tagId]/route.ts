import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const tagId = parseInt(params.tagId)

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: '잘못된 ID 형식입니다.' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(tag, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { tagId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const tagId = parseInt(params.tagId)

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: '잘못된 ID 형식입니다.' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    await prisma.tag.delete({
      where: { id: tagId },
    })

    return NextResponse.json(
      { message: '태그가 삭제되었습니다.' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
