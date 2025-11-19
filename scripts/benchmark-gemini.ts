/**
 * Gemini API 속도 측정 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/benchmark-gemini.ts
 */

import 'dotenv/config'
import { generatePostSummary, generateMonthlyReport } from '../src/lib/gemini'

// 테스트 데이터
const samplePost = {
  title: 'Next.js 15에서 Server Actions 사용하기',
  content: `
# Next.js 15 Server Actions

Next.js 15에서 Server Actions를 사용하여 서버 측 로직을 간단하게 처리할 수 있습니다.

## 주요 특징
- Form 제출을 서버에서 직접 처리
- 클라이언트 JavaScript 번들 크기 감소
- Progressive Enhancement 지원

## 구현 예시
\`\`\`typescript
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
  redirect('/posts')
}
\`\`\`

## 장점
1. 타입 안전성
2. 간단한 데이터 전송
3. 자동 재검증

이를 통해 API 라우트 없이도 서버 로직을 쉽게 구현할 수 있습니다.
  `.trim()
}

const samplePosts = Array(10).fill(null).map((_, i) => ({
  id: i + 1,
  title: `테스트 포스트 ${i + 1}`,
  summary: `이것은 테스트 포스트 ${i + 1}의 요약입니다.`,
  createdAt: new Date(),
  postTags: [
    { tag: { name: i % 2 === 0 ? 'React' : 'TypeScript' } },
    { tag: { name: 'Next.js' } }
  ]
}))

async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  console.log(`\n${name} 측정 시작...`)
  const startTime = performance.now()

  try {
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`${name} 완료: ${(duration / 1000).toFixed(2)}초`)
    return { result, duration }
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    console.error(`${name} 실패 (${(duration / 1000).toFixed(2)}초):`,
      error instanceof Error ? error.message : String(error))
    throw error
  }
}

async function runBenchmark() {
  console.log('Gemini API 벤치마크 시작\n')
  console.log('=' .repeat(60))

  const results: { name: string; duration: number; success: boolean }[] = []

  // 1. Summary 생성 테스트 (단일)
  try {
    const { duration } = await measureTime(
      'Summary 생성 (flash 모델)',
      () => generatePostSummary(samplePost.title, samplePost.content)
    )
    results.push({ name: 'Summary (단일)', duration, success: true })
  } catch (error) {
    results.push({ name: 'Summary (단일)', duration: 0, success: false })
  }

  // 2. Summary 생성 테스트 (5회 연속)
  console.log('\n' + '=' .repeat(60))
  console.log('Summary 5회 연속 생성 테스트')
  const summaryDurations: number[] = []

  for (let i = 0; i < 5; i++) {
    try {
      const { duration } = await measureTime(
        `Summary ${i + 1}/5`,
        () => generatePostSummary(
          `테스트 포스트 ${i + 1}`,
          `이것은 테스트 포스트 ${i + 1}의 내용입니다. ${samplePost.content}`
        )
      )
      summaryDurations.push(duration)
    } catch (error) {
      summaryDurations.push(0)
    }
  }

  const avgSummary = summaryDurations.reduce((a, b) => a + b, 0) / summaryDurations.length
  results.push({ name: 'Summary (평균)', duration: avgSummary, success: true })

  // 3. Monthly Report 생성 테스트
  console.log('\n' + '=' .repeat(60))
  try {
    const { duration } = await measureTime(
      'Monthly Report 생성 (pro 모델)',
      () => generateMonthlyReport(samplePosts as any)
    )
    results.push({ name: 'Report (단일)', duration, success: true })
  } catch (error) {
    results.push({ name: 'Report (단일)', duration: 0, success: false })
  }

  // 결과 요약
  console.log('\n' + '=' .repeat(60))
  console.log('벤치마크 결과 요약\n')

  console.table(results.map(r => ({
    '작업': r.name,
    '소요 시간': r.success ? `${(r.duration / 1000).toFixed(2)}초` : 'FAILED',
    '상태': r.success ? 'OK' : 'FAIL'
  })))

  console.log('\n분석:')
  const summaryAvg = results.find(r => r.name === 'Summary (평균)')?.duration ?? 0
  const reportTime = results.find(r => r.name === 'Report (단일)')?.duration ?? 0

  console.log(`- Summary 평균 소요 시간: ${(summaryAvg / 1000).toFixed(2)}초`)
  console.log(`- Report 소요 시간: ${(reportTime / 1000).toFixed(2)}초`)

  if (summaryAvg > 5000) {
    console.log('\nSummary가 5초 이상 소요 → 비동기 처리 권장')
  } else {
    console.log('\nSummary는 빠름 → 동기 처리 가능')
  }

  if (reportTime > 10000) {
    console.log('Report가 10초 이상 소요 → 비동기 처리 필수')
  } else {
    console.log('Report는 적당함 → 선택적 비동기 처리')
  }

  console.log('\n' + '=' .repeat(60))
}

runBenchmark().catch(console.error)
