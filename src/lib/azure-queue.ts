import { QueueClient, QueueServiceClient } from '@azure/storage-queue'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING

if (!connectionString) {
  console.warn('[Queue] AZURE_STORAGE_CONNECTION_STRING 환경변수가 설정되지 않았습니다.')
}

const QUEUE_NAMES = {
  SUMMARY: 'summary-queue',
} as const

function getQueueClient(queueName: string): QueueClient {
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING 환경변수가 설정되지 않았습니다.')
  }

  const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString)
  return queueServiceClient.getQueueClient(queueName)
}

export async function sendSummaryJob(postId: number) {
  try {
    const queueClient = getQueueClient(QUEUE_NAMES.SUMMARY)

    await queueClient.createIfNotExists()

    const message = JSON.stringify({ postId })
    const encodedMessage = Buffer.from(message).toString('base64')

    await queueClient.sendMessage(encodedMessage)
  } catch (error) {
    console.error('[Queue] 요약 작업 전송 실패:', error)
    throw error
  }
}

export async function getQueueLength(queueName: 'summary-queue'): Promise<number> {
  try {
    const queueClient = getQueueClient(queueName)
    const properties = await queueClient.getProperties()
    return properties.approximateMessagesCount ?? 0
  } catch (error) {
    console.error(`[Queue] 큐 길이 조회 실패: ${queueName}`, error)
    return 0
  }
}
