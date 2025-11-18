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

afterEach(async () => {
  await prisma.postTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/tags', () => {
  it('로그인한 사용자가 태그를 생성할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'JavaScript',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty('id')
    expect(data.name).toBe('JavaScript')
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'JavaScript',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('태그 이름이 없으면 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('태그 이름은 필수입니다.')
  })

  it('중복된 태그 이름은 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'JavaScript',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('이미 존재하는 태그입니다.')
  })
})
