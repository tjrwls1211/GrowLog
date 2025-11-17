import { GoogleGenAI } from '@google/genai'

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('환경변수 GEMINI_API_KEY가 설정되지 않았습니다.')
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
}

interface Post {
  id: number
  title: string
  summary: string
  createdAt: Date
  postTags: {
    tag: {
      name: string
    }
  }[]
}

interface TagStat {
  name: string
  count: number
}

export async function generateMonthlyReport(posts: Post[]): Promise<string> {
  if (posts.length === 0) {
    return '이번 달에 작성된 포스트가 없습니다. 학습을 시작해보세요!'
  }

  const tagStats = calculateTagStats(posts)
  const prompt = buildPrompt(posts, tagStats)

  try {
    const ai = getGeminiClient()

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return response.text || '리포트 생성에 실패했습니다.'
  } catch (error) {
    throw new Error('AI 리포트 생성 중 오류가 발생했습니다.')
  }
}

function calculateTagStats(posts: Post[]): TagStat[] {
  const tagCount: Record<string, number> = {}

  posts.forEach((post) => {
    post.postTags.forEach(({ tag }) => {
      tagCount[tag.name] = (tagCount[tag.name] || 0) + 1
    })
  })

  return Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function buildPrompt(posts: Post[], tagStats: TagStat[]): string {
  const totalPosts = posts.length
  const tagSummary =
    tagStats.length > 0
      ? tagStats.map((t) => `${t.name} (${t.count}회)`).join(', ')
      : '태그 없음'

  const postSummaries = posts
    .slice(0, 5)
    .map((p) => `- ${p.title}: ${p.summary}`)
    .join('\n')

  return `
당신은 개발자의 학습을 돕는 AI 멘토입니다. 사용자의 월간 학습 포스트를 분석하고, 요약과 피드백을 제공합니다.

이번 달 학습 데이터:
- 총 포스트 수: ${totalPosts}개
- 주요 학습 태그: ${tagSummary}

최근 포스트 샘플:
${postSummaries}

다음 내용을 포함한 월간 리포트를 작성해주세요:
1. 이번 달 학습 요약 (2-3문장)
2. 주요 학습 주제 및 태그 비율 분석
3. 다음 달 학습 방향 제안 (구체적으로)

마크다운 형식으로 작성해주세요.
  `.trim()
}

export async function generatePostSummary(
  title: string,
  content: string
): Promise<string> {
  try {
    const ai = getGeminiClient()

    const prompt = `
다음 학습 포스트를 2-3문장으로 요약해주세요:

제목: ${title}
내용: ${content}

핵심 내용과 배운 점을 중심으로 간단명료하게 요약해주세요.
    `.trim()

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return response.text || content.slice(0, 200)
  } catch (error) {
    return content.slice(0, 200)
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
    })
    return !!response.text
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}
