import Link from 'next/link'
import Card from '@/components/ui/Card'
import ReportsClient from './ReportsClient'
import { getSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import type { ReportSnapshot } from '@/types/report'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await getSession().catch(() => null)

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-20 text-center">
        <h1 className="text-3xl font-semibold">AI 학습 리포트</h1>
        <p className="text-base text-[var(--color-foreground)]/70">
          작성한 글과 태그를 기반으로 AI가 학습 패턴을 분석하고 다음 학습 방향을 제안해 줍니다.
          로그인 후 리포트를 생성해 보세요.
        </p>
        <Link href="/auth/signin" className="btn btn-primary btn--lg inline-flex gap-2">
          로그인하고 시작하기
        </Link>
      </div>
    )
  }

  const reports = await prisma.report.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const serializedReports: ReportSnapshot[] = reports.map((report) => ({
    id: report.id,
    content: report.content,
    postCount: report.postCount,
    periodType: report.periodType,
    createdAt: report.createdAt.toISOString(),
    status: report.status,
    error: report.error,
  }))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const monthlyPostCount = await prisma.post.count({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
  })

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-white">
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            AI Monthly Report
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold">AI 학습 리포트</h1>
          <p className="text-base text-white/80 max-w-2xl">
            {session.user.name ? `${session.user.name}님이` : '지금까지'} 기록한 글과 태그를 한눈에
            정리해 드려요. 매달 학습 패턴과 강약점을 정리하고 다음에 집중할 방향까지 추천받아
            보세요.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
              태그 분포 분석
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
              학습 패턴 요약
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
              다음 학습 가이드
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-64 translate-x-12 bg-white/20 blur-3xl"
        />
      </Card>

      <ReportsClient
        initialReports={serializedReports}
        userName={session.user.name}
        monthlyPostCount={monthlyPostCount}
      />
    </div>
  )
}
