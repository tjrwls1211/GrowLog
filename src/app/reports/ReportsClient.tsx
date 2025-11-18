'use client'
import { useMemo, useRef, useState } from 'react'
import Card from '@/components/ui/Card'
import type { ReportSnapshot } from '@/types/report'
import ReactMarkdown from 'react-markdown'

type ReportsClientProps = {
  initialReports: ReportSnapshot[]
  userName?: string | null
  monthlyPostCount: number
}

const relativeFormatter = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })
const monthFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' })
const fullDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
})

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
]

export default function ReportsClient({
  initialReports,
  userName,
  monthlyPostCount,
}: ReportsClientProps) {
  const [reports, setReports] = useState<ReportSnapshot[]>(initialReports)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(
    initialReports[0]?.id ?? null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement | null>(null)

  const selectedReport = useMemo<ReportSnapshot | null>(() => {
    if (!reports.length) return null
    if (selectedReportId === null) return reports[0]
    return reports.find((report) => report.id === selectedReportId) ?? reports[0]
  }, [reports, selectedReportId])

  const stats = useMemo(() => {
    const latest = reports[0]
    return [
      {
        label: '내 리포트',
        value: reports.length ? `${reports.length}건` : '0건',
      },
      {
        label: '이번 달 글',
        value: monthlyPostCount ? `${monthlyPostCount}개` : '0개',
      },
      {
        label: '최근 생성',
        value: latest ? formatRelativeTime(latest.createdAt) : '미생성',
      },
    ]
  }, [monthlyPostCount, reports])

  async function handleGenerateReport() {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'AI 리포트를 생성할 수 없었어요.')
      }

      const newReport = normalizeReport(payload)
      setReports((prev) => [newReport, ...prev])
      setSelectedReportId(newReport.id)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '리포트를 생성하는 중 오류가 발생했어요.'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              AI Report
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {userName ? `${userName}님의 요약 리포트` : '맞춤 AI 리포트'}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-foreground)]/70">
              이번 달에 작성한 글과 태그를 바탕으로 다음 학습 방향을 제안해
              드려요.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="btn btn-primary btn--lg flex-1 sm:flex-none min-w-[200px] justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerateReport}
              disabled={isGenerating || !monthlyPostCount}
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  리포트 생성 중...
                </>
              ) : (
                '이번 달 리포트 만들기'
              )}
            </button>
            <div className="text-xs text-[var(--color-foreground)]/60 space-y-1 min-h-[2.5rem] flex flex-col justify-center">
              {!monthlyPostCount && (
                <p className="text-[var(--color-foreground)]/70">
                  작성한 글이 없어서 리포트를 생성할 수 없어요.
                </p>
              )}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-[var(--color-foreground)]/70">
            리포트 스냅샷
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 justify-items-center text-center sm:justify-items-start sm:text-left">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-[var(--color-foreground)]/60">{stat.label}</p>
                <p className="mt-1 text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <Card className="p-4 space-y-4 h-fit">
          <div>
            <h3 className="text-lg font-semibold">리포트 타임라인</h3>
            <p className="text-sm text-[var(--color-foreground)]/60">
              생성한 리포트 중 하나를 선택해 상세 내용을 확인해 보세요.
            </p>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {reports.length ? (
              reports.map((report) => {
                const isActive = selectedReport?.id === report.id
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => {
                      setSelectedReportId(report.id)
                      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={[
                      'w-full rounded-xl border px-4 py-3 text-left transition cursor-pointer',
                      isActive
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                        : 'border-[var(--color-border)] hover:border-[var(--primary)]/60',
                    ].join(' ')}
                  >
                    <p className="text-sm font-semibold">
                      {monthFormatter.format(new Date(report.createdAt))}
                    </p>
                    <p className="text-xs text-[var(--color-foreground)]/60">
                      {report.periodType === 'MONTHLY' ? '월간' : '주간'} · 글 {report.postCount}개 ·{' '}
                      {formatRelativeTime(report.createdAt)}
                    </p>
                  </button>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--background)]/60 p-4 text-sm text-[var(--color-foreground)]/70">
                아직 생성된 리포트가 없어요. 첫 번째 리포트를 생성하면 이곳에서 히스토리를 볼 수
                있어요.
              </div>
            )}
          </div>
        </Card>

        <div ref={detailRef}>
          <Card className="p-6" id="report-detail">
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-foreground)]/70">
                  <span className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    {selectedReport.periodType === 'MONTHLY' ? '월간 리포트' : '주간 리포트'}
                  </span>
                  <span>{fullDateFormatter.format(new Date(selectedReport.createdAt))}</span>
                  <span aria-hidden="true">·</span>
                  <span>글 {selectedReport.postCount}개 요약</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {monthFormatter.format(new Date(selectedReport.createdAt))} 인사이트
                  </h2>
                  <p className="text-sm text-[var(--color-foreground)]/70">
                    AI가 작성한 리포트를 참고해 앞으로의 학습 방향을 잡아보세요.
                  </p>
                </div>

                <div className="prose prose-slate max-w-none mt-6 [&>*]:mb-4 [&>h1]:mb-4 [&>h2]:mb-3 [&>h3]:mb-3 [&>p]:leading-relaxed [&>ul]:space-y-2 [&>ol]:space-y-2">
                  <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-16">
                <p className="text-lg font-semibold">아직 리포트가 없어요</p>
                <p className="text-sm text-[var(--color-foreground)]/70">
                  상단의 버튼을 눌러 AI 리포트를 생성하면 상세 내용이 이곳에 표시됩니다.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function normalizeReport(report: any): ReportSnapshot {
  return {
    id: Number(report.id),
    content: String(report.content ?? ''),
    postCount: Number(report.postCount ?? 0),
    periodType: report.periodType === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY',
    createdAt:
      typeof report.createdAt === 'string'
        ? report.createdAt
        : new Date(report.createdAt).toISOString(),
  }
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate).getTime()
  const diff = date - Date.now()

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms || unit === 'minute') {
      return relativeFormatter.format(Math.round(diff / ms), unit)
    }
  }

  return '방금 전'
}
