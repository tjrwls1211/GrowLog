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

describe('POST /api/posts/[postId]/tags', () => {
  it('작성자가 자신의 글에 태그를 추가할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
      }),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty('id')
    expect(data.postId).toBe(post.id)
    expect(data.tagId).toBe(tag.id)

    const postTag = await prisma.postTag.findUnique({
      where: {
        postId_tagId: {
          postId: post.id,
          tagId: tag.id,
        },
      },
    })
    expect(postTag).not.toBeNull()
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
      }),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('다른 사람의 글에 태그를 추가하려고 하면 403 에러를 반환해야 한다', async () => {
    const author = await prisma.user.create({
      data: {
        email: 'author@example.com',
        name: '작성자',
      },
    })

    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        name: '다른 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '작성자의 글',
        content: '내용',
        userId: author.id,
      },
    })

    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: otherUser.id, email: otherUser.email },
    })

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
      }),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('권한이 없습니다.')
  })

  it('존재하지 않는 글에 태그 추가 시 404 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request('http://localhost/api/posts/99999/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
      }),
    })

    const response = await POST(request, { params: { postId: '99999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('게시글을 찾을 수 없습니다.')
  })

  it('존재하지 않는 태그 추가 시 404 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: 99999,
      }),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('태그를 찾을 수 없습니다.')
  })

  it('tagId가 없으면 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('태그 ID는 필수입니다.')
  })

  it('이미 추가된 태그는 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '테스트 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
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

    const request = new Request(`http://localhost/api/posts/${post.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagId: tag.id,
      }),
    })

    const response = await POST(request, { params: { postId: String(post.id) } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('이미 추가된 태그입니다.')
  })
})
