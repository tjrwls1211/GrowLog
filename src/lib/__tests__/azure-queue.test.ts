/**
 * @jest-environment node
 */
import { sendSummaryJobWithRetry, getQueueLength } from '../azure-queue'

const mockQueueClient = {
  createIfNotExists: jest.fn(),
  sendMessage: jest.fn(),
  getProperties: jest.fn(),
}

const mockQueueServiceClient = {
  getQueueClient: jest.fn(() => mockQueueClient),
}

jest.mock('@azure/storage-queue', () => ({
  QueueServiceClient: {
    fromConnectionString: jest.fn(() => mockQueueServiceClient),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test'
})

afterEach(() => {
  delete process.env.AZURE_STORAGE_CONNECTION_STRING
})

describe('sendSummaryJobWithRetry', () => {
  it('첫 시도에서 성공하면 바로 반환해야 한다', async () => {
    mockQueueClient.createIfNotExists.mockResolvedValue({})
    mockQueueClient.sendMessage.mockResolvedValue({})

    await sendSummaryJobWithRetry(123)

    expect(mockQueueClient.sendMessage).toHaveBeenCalledTimes(1)
    expect(mockQueueClient.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('eyJwb3N0SWQiOjEyM30=')
    )
  })

  it('첫 시도 실패 시 재시도해야 한다', async () => {
    mockQueueClient.createIfNotExists.mockResolvedValue({})
    mockQueueClient.sendMessage
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({})

    await sendSummaryJobWithRetry(123)

    expect(mockQueueClient.sendMessage).toHaveBeenCalledTimes(2)
  })

  it('3번 모두 실패하면 에러를 던져야 한다', async () => {
    mockQueueClient.createIfNotExists.mockResolvedValue({})
    mockQueueClient.sendMessage.mockRejectedValue(new Error('Network error'))

    await expect(sendSummaryJobWithRetry(123)).rejects.toThrow('Network error')

    expect(mockQueueClient.sendMessage).toHaveBeenCalledTimes(3)
  })

  it('재시도 간격이 지수 백오프 방식이어야 한다', async () => {
    mockQueueClient.createIfNotExists.mockResolvedValue({})
    mockQueueClient.sendMessage
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce({})

    const startTime = Date.now()
    await sendSummaryJobWithRetry(123)
    const duration = Date.now() - startTime

    expect(duration).toBeGreaterThanOrEqual(3000)
    expect(mockQueueClient.sendMessage).toHaveBeenCalledTimes(3)
  })

  it('올바른 메시지 형식으로 전송해야 한다', async () => {
    mockQueueClient.createIfNotExists.mockResolvedValue({})
    mockQueueClient.sendMessage.mockResolvedValue({})

    await sendSummaryJobWithRetry(456)

    const expectedMessage = Buffer.from(JSON.stringify({ postId: 456 })).toString('base64')
    expect(mockQueueClient.sendMessage).toHaveBeenCalledWith(expectedMessage)
  })
})

describe('getQueueLength', () => {
  it('Queue 길이를 반환해야 한다', async () => {
    mockQueueClient.getProperties.mockResolvedValue({
      approximateMessagesCount: 5,
    })

    const length = await getQueueLength('summary-queue')

    expect(length).toBe(5)
    expect(mockQueueClient.getProperties).toHaveBeenCalledTimes(1)
  })

  it('approximateMessagesCount가 없으면 0을 반환해야 한다', async () => {
    mockQueueClient.getProperties.mockResolvedValue({})

    const length = await getQueueLength('summary-queue')

    expect(length).toBe(0)
  })

  it('에러 발생 시 0을 반환해야 한다', async () => {
    mockQueueClient.getProperties.mockRejectedValue(new Error('Network error'))

    const length = await getQueueLength('summary-queue')

    expect(length).toBe(0)
  })
})
