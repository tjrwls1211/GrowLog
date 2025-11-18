/**
 * @jest-environment node
 */
import { GET, DELETE } from '../route'
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

describe('GET /api/tags/[tagId]', () => {
  it('태그를 조회할 수 있어야 한다', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: 'Java',
      },
    })

    const response = await GET(
      new Request(`http://localhost/api/tags/${tag.id}`),
      { params: { tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(tag.id)
    expect(data.name).toBe('Java')
  })

  it('존재하지 않는 태그 조회 시 404 에러를 반환해야 한다', async () => {
    const response = await GET(
      new Request('http://localhost/api/tags/99999'),
      { params: { tagId: '99999' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('태그를 찾을 수 없습니다.')
  })

  it('잘못된 ID 형식은 400 에러를 반환해야 한다', async () => {
    const response = await GET(
      new Request('http://localhost/api/tags/invalid'),
      { params: { tagId: 'invalid' } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('잘못된 ID 형식입니다.')
  })
})

describe('DELETE /api/tags/[tagId]', () => {
  it('로그인한 사용자가 태그를 삭제할 수 있어야 한다', async () => {
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
      new Request(`http://localhost/api/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('태그가 삭제되었습니다.')

    const deletedTag = await prisma.tag.findUnique({
      where: { id: tag.id },
    })
    expect(deletedTag).toBeNull()
  })

  it('로그인하지 않은 경우 401 에러를 반환해야 한다', async () => {
    const tag = await prisma.tag.create({
      data: {
        name: 'JavaScript',
      },
    })

    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const response = await DELETE(
      new Request(`http://localhost/api/tags/${tag.id}`, {
        method: 'DELETE',
      }),
      { params: { tagId: String(tag.id) } }
    )
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('존재하지 않는 태그 삭제 시 404 에러를 반환해야 한다', async () => {
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
      new Request('http://localhost/api/tags/99999', {
        method: 'DELETE',
      }),
      { params: { tagId: '99999' } }
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('태그를 찾을 수 없습니다.')
  })

  it('잘못된 ID 형식은 400 에러를 반환해야 한다', async () => {
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
      new Request('http://localhost/api/tags/invalid', {
        method: 'DELETE',
      }),
      { params: { tagId: 'invalid' } }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('잘못된 ID 형식입니다.')
  })
})
