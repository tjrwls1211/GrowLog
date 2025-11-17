/**
 * @jest-environment node
 */
import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/gemini', () => ({
  generateMonthlyReport: jest.fn().mockImplementation(async (posts: any[]) => {
    if (posts.length === 0) {
      return '이번 달에 작성된 포스트가 없습니다. 학습을 시작해보세요!'
    }
    return '# 월간 학습 리포트\n\nAI가 생성한 리포트입니다.'
  }),
}))

afterEach(async () => {
  await prisma.report.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/reports', () => {
  it('로그인한 사용자가 월간 리포트를 생성할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const tag = await prisma.tag.create({
      data: { name: 'React' },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 포스트',
        content: '테스트 내용',
        summary: '테스트 요약',
        userId: testUser.id,
      },
    })

    await prisma.postTag.create({
      data: {
        postId: post.id,
        tagId: tag.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty('id')
    expect(data.content).toBe('# 월간 학습 리포트\n\nAI가 생성한 리포트입니다.')
    expect(data.postCount).toBe(1)
    expect(data.periodType).toBe('MONTHLY')
    expect(data.userId).toBe(testUser.id)
    expect(data).toHaveProperty('createdAt')
  })

  it('포스트가 없어도 리포트를 생성할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.postCount).toBe(0)
    expect(data.content).toContain('이번 달에 작성된 포스트가 없습니다')
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('이번 달 포스트만 포함해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)

    await prisma.post.create({
      data: {
        title: '이번 달 포스트',
        content: '내용',
        summary: '요약',
        userId: testUser.id,
        createdAt: now,
      },
    })

    await prisma.post.create({
      data: {
        title: '지난 달 포스트',
        content: '내용',
        summary: '요약',
        userId: testUser.id,
        createdAt: lastMonth,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.postCount).toBe(1)
  })
})
