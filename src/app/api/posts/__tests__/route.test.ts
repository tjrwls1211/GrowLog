/**
 * @jest-environment node
 */
import { POST, GET } from '../route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/gemini', () => ({
  generatePostSummary: jest
    .fn()
    .mockResolvedValue('AI가 생성한 요약입니다.'),
}))

afterEach(async () => {
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/posts', () => {
  it('로그인한 사용자가 제목과 내용으로 글을 작성할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '테스트 제목',
        content: '테스트 내용입니다.',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty('id')
    expect(data.title).toBe('테스트 제목')
    expect(data.content).toBe('테스트 내용입니다.')
    expect(data.summary).toBe('AI가 생성한 요약입니다.')
    expect(data.userId).toBe(testUser.id)
    expect(data.isPublic).toBe(false)
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
  })

  it('제목이 없으면 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '테스트 내용입니다.',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('제목은 필수입니다.')
  })

  it('내용이 없으면 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '테스트 제목',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('내용은 필수입니다.')
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '테스트 제목',
        content: '테스트 내용',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('비공개 글을 작성할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '비공개 글',
        content: '비공개 내용',
        isPublic: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.isPublic).toBe(false)
  })
})

describe('GET /api/posts', () => {
  it('전체 글 목록을 조회할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    await prisma.post.createMany({
      data: [
        { title: '글 1', content: '내용 1', userId: testUser.id, isPublic: true },
        { title: '글 2', content: '내용 2', userId: testUser.id, isPublic: true },
        { title: '글 3', content: '내용 3', userId: testUser.id, isPublic: true },
      ],
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(3)
  })

  it('최신순으로 정렬되어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post1 = await prisma.post.create({
      data: { title: '첫 번째 글', content: '내용', userId: testUser.id, isPublic: true },
    })

    await new Promise(resolve => setTimeout(resolve, 10))

    const post2 = await prisma.post.create({
      data: { title: '두 번째 글', content: '내용', userId: testUser.id, isPublic: true },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data[0].id).toBe(post2.id)
    expect(data[1].id).toBe(post1.id)
  })

  it('공개 글만 조회할 수 있어야 한다 (로그인하지 않은 경우)', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    await prisma.post.createMany({
      data: [
        { title: '공개 글', content: '내용', userId: testUser.id, isPublic: true },
        { title: '비공개 글', content: '내용', userId: testUser.id, isPublic: false },
      ],
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('공개 글')
  })

  it('로그인한 사용자는 자신의 비공개 글도 조회할 수 있어야 한다', async () => {
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

    await prisma.post.createMany({
      data: [
        { title: '내 공개 글', content: '내용', userId: testUser.id, isPublic: true },
        { title: '내 비공개 글', content: '내용', userId: testUser.id, isPublic: false },
        { title: '다른 사람 공개 글', content: '내용', userId: otherUser.id, isPublic: true },
        { title: '다른 사람 비공개 글', content: '내용', userId: otherUser.id, isPublic: false },
      ],
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(3)

    const titles = data.map((post: any) => post.title)
    expect(titles).toContain('내 공개 글')
    expect(titles).toContain('내 비공개 글')
    expect(titles).toContain('다른 사람 공개 글')
    expect(titles).not.toContain('다른 사람 비공개 글')
  })
})
