import { config } from 'dotenv'
import { generatePostSummary } from '../src/lib/gemini'

config()

async function main() {
  console.log('포스트 요약 생성 테스트 시작')

  const title = 'React Hooks 학습'
  const content = `
오늘은 React Hooks에 대해 깊이 있게 학습했습니다.

useState는 함수형 컴포넌트에서 상태를 관리할 수 있게 해주는 훅입니다.
초기값을 설정하고, 상태를 업데이트하는 함수를 제공합니다.

useEffect는 사이드 이펙트를 처리하는 훅으로, 컴포넌트가 렌더링된 후 실행됩니다.
dependency array를 통해 특정 값이 변경될 때만 실행되도록 최적화할 수 있습니다.

useCallback과 useMemo를 사용하면 불필요한 재계산을 방지하여 성능을 최적화할 수 있습니다.
  `.trim()

  console.log('\n원본:')
  console.log('제목:', title)
  console.log('내용:', content)

  try {
    const summary = await generatePostSummary(title, content)
    console.log('\n생성된 요약:')
    console.log(summary)
  } catch (error) {
    console.error('요약 생성 실패:', error)
    process.exit(1)
  }
}

main()
