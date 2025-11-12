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
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: '태그 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    const existingTag = await prisma.tag.findUnique({
      where: {
        name,
      },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: '이미 존재하는 태그입니다.' },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
