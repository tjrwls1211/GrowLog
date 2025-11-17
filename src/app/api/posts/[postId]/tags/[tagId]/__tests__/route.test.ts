/**
 * @jest-environment node
 */
import { DELETE } from '../route'
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

describe('DELETE /api/posts/[postId]/tags/[tagId]', () => {
  it('작성자가 자신의 글에서 태그를 제거할 수 있어야 한다', async () => {
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

    const postTag = await prisma.postTag.create({
      data: {
        postId: post.id,
        tagId: tag.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await DELETE(
      new Request(`http://localhost/api/posts/${post.id}/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id), tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('태그가 제거되었습니다.')

    const deletedPostTag = await prisma.postTag.findUnique({
      where: {
        postId_tagId: {
          postId: post.id,
          tagId: tag.id,
        },
      },
    })
    expect(deletedPostTag).toBeNull()
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

    await prisma.postTag.create({
      data: {
        postId: post.id,
        tagId: tag.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await DELETE(
      new Request(`http://localhost/api/posts/${post.id}/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id), tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('다른 사람의 글에서 태그를 제거하려고 하면 403 에러를 반환해야 한다', async () => {
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

    await prisma.postTag.create({
      data: {
        postId: post.id,
        tagId: tag.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: otherUser.id, email: otherUser.email },
    })

    const response = await DELETE(
      new Request(`http://localhost/api/posts/${post.id}/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id), tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('권한이 없습니다.')
  })

  it('존재하지 않는 글에서 태그 제거 시 404 에러를 반환해야 한다', async () => {
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

    const response = await DELETE(
      new Request(`http://localhost/api/posts/99999/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: '99999', tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('게시글을 찾을 수 없습니다.')
  })

  it('연결되지 않은 태그 제거 시 404 에러를 반환해야 한다', async () => {
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

    const response = await DELETE(
      new Request(`http://localhost/api/posts/${post.id}/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id), tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('연결된 태그를 찾을 수 없습니다.')
  })

  it('잘못된 postId 형식은 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await DELETE(
      new Request('http://localhost/api/posts/invalid/tags/1', {
        method: 'DELETE',
      }),
      { params: { postId: 'invalid', tagId: '1' } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('잘못된 ID 형식입니다.')
  })

  it('잘못된 tagId 형식은 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await DELETE(
      new Request('http://localhost/api/posts/1/tags/invalid', {
        method: 'DELETE',
      }),
      { params: { postId: '1', tagId: 'invalid' } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('잘못된 ID 형식입니다.')
  })
})
