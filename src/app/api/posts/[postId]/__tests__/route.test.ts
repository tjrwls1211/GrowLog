/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '../route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

afterEach(async () => {
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GET /api/posts/[postId]', () => {
  it('공개 글을 조회할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '공개 글',
        content: '공개 내용',
        isPublic: true,
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET(
      new Request(`http://localhost:3000/api/posts/${post.id}`),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(post.id)
    expect(data.title).toBe('공개 글')
    expect(data.content).toBe('공개 내용')
  })

  it('로그인하지 않은 경우 비공개 글 조회 시 403 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '비공개 글',
        content: '비공개 내용',
        isPublic: false,
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET(
      new Request(`http://localhost:3000/api/posts/${post.id}`),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('접근 권한이 없습니다.')
  })

  it('작성자는 자신의 비공개 글을 조회할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '내 비공개 글',
        content: '비공개 내용',
        isPublic: false,
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await GET(
      new Request(`http://localhost:3000/api/posts/${post.id}`),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(post.id)
    expect(data.title).toBe('내 비공개 글')
  })

  it('존재하지 않는 글 조회 시 404 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost:3000/api/posts/99999'),
      { params: { postId: '99999' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('게시글을 찾을 수 없습니다.')
  })

  it('잘못된 ID 형식은 400 에러를 반환해야 한다', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost:3000/api/posts/invalid'),
      { params: { postId: 'invalid' } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('잘못된 ID 형식입니다.')
  })
})

describe('PUT /api/posts/[postId]', () => {
  it('작성자가 자신의 글을 수정할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '원래 제목',
        content: '원래 내용',
        isPublic: true,
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await PUT(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '수정된 제목',
          content: '수정된 내용',
          isPublic: false,
        }),
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('수정된 제목')
    expect(data.content).toBe('수정된 내용')
    expect(data.isPublic).toBe(false)
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
        title: '제목',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await PUT(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '수정된 제목',
          content: '수정된 내용',
        }),
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('다른 사람의 글을 수정하려고 하면 403 에러를 반환해야 한다', async () => {
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

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: otherUser.id, email: otherUser.email },
    })

    const response = await PUT(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '수정된 제목',
          content: '수정된 내용',
        }),
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('수정 권한이 없습니다.')
  })

  it('존재하지 않는 글 수정 시 404 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await PUT(
      new Request('http://localhost:3000/api/posts/99999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '수정된 제목',
          content: '수정된 내용',
        }),
      }),
      { params: { postId: '99999' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('게시글을 찾을 수 없습니다.')
  })

  it('제목이 없으면 400 에러를 반환해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '제목',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await PUT(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '수정된 내용',
        }),
      }),
      { params: { postId: String(post.id) } }
    )
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

    const post = await prisma.post.create({
      data: {
        title: '제목',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await PUT(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '수정된 제목',
        }),
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('내용은 필수입니다.')
  })
})

describe('DELETE /api/posts/[postId]', () => {
  it('작성자가 자신의 글을 삭제할 수 있어야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: '삭제할 글',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
    })

    const response = await DELETE(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('게시글이 삭제되었습니다.')

    const deletedPost = await prisma.post.findUnique({
      where: { id: post.id },
    })
    expect(deletedPost).toBeNull()
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
        title: '제목',
        content: '내용',
        userId: testUser.id,
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await DELETE(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('다른 사람의 글을 삭제하려고 하면 403 에러를 반환해야 한다', async () => {
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

    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: otherUser.id, email: otherUser.email },
    })

    const response = await DELETE(
      new Request(`http://localhost:3000/api/posts/${post.id}`, {
        method: 'DELETE',
      }),
      { params: { postId: String(post.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('삭제 권한이 없습니다.')
  })

  it('존재하지 않는 글 삭제 시 404 에러를 반환해야 한다', async () => {
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
      new Request('http://localhost:3000/api/posts/99999', {
        method: 'DELETE',
      }),
      { params: { postId: '99999' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('게시글을 찾을 수 없습니다.')
  })
})
