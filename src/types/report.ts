export type ReportSnapshot = {
  id: number
  content: string
  postCount: number
  periodType: 'WEEKLY' | 'MONTHLY'
  createdAt: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  error?: string | null
}

