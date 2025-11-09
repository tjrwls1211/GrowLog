/**
 * @jest-environment node
 */
import { GET } from '../route'
import { prisma } from '@/lib/prisma'

afterEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('GET /api/users/[id]', () => {
  it('사용자를 성공적으로 조회해야 한다', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '테스트 유저',
      },
    })

    const request = new Request(`http://localhost:3000/api/users/${testUser.id}`, {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: testUser.id.toString() } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(testUser.id)
    expect(data.email).toBe('test@example.com')
    expect(data.name).toBe('테스트 유저')
    expect(data).toHaveProperty('createdAt')
  })

  it('존재하지 않는 사용자 ID로 조회시 404를 반환해야 한다', async () => {
    const request = new Request('http://localhost:3000/api/users/99999', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: '99999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('사용자를 찾을 수 없습니다.')
  })

  it('유효하지 않은 사용자 ID로 조회시 400을 반환해야 한다', async () => {
    const request = new Request('http://localhost:3000/api/users/invalid', {
      method: 'GET',
    })

    const response = await GET(request, { params: { id: 'invalid' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('유효하지 않은 사용자 ID입니다.')
  })
})
