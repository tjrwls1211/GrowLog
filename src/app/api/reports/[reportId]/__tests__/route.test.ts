/**
 * @jest-environment node
 */
import { GET } from '../route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

afterEach(async () => {
  await prisma.report.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GET /api/reports/[reportId]', () => {
  it('로그인한 사용자가 자신의 리포트를 조회할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const report = await prisma.report.create({
      data: {
        userId: testUser.id,
        content: '테스트 리포트',
        postCount: 5,
        periodType: 'MONTHLY',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/reports/1')
    const response = await GET(request, { params: { reportId: String(report.id) } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(report.id)
    expect(data.content).toBe('테스트 리포트')
    expect(data.postCount).toBe(5)
    expect(data.periodType).toBe('MONTHLY')
  })

  it('존재하지 않는 리포트 ID는 404를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/reports/999')
    const response = await GET(request, { params: { reportId: '999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('리포트를 찾을 수 없습니다.')
  })

  it('다른 사용자의 리포트는 403을 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: '다른 유저',
      },
    })

    const report = await prisma.report.create({
      data: {
        userId: otherUser.id,
        content: '다른 사람 리포트',
        postCount: 3,
        periodType: 'MONTHLY',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/reports/1')
    const response = await GET(request, { params: { reportId: String(report.id) } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('접근 권한이 없습니다.')
  })

  it('유효하지 않은 리포트 ID는 400을 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/reports/invalid')
    const response = await GET(request, { params: { reportId: 'invalid' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('유효하지 않은 리포트 ID입니다.')
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/reports/1')
    const response = await GET(request, { params: { reportId: '1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })
})
