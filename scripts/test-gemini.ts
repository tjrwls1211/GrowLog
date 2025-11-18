import { config } from 'dotenv'
import { testConnection } from '../src/lib/gemini'

config()

async function main() {
  console.log('Gemini API 연결 테스트 시작')

  const isConnected = await testConnection()

  if (isConnected) {
    console.log('Gemini API 연결 성공')
  } else {
    console.log('Gemini API 연결 실패')
    console.log('환경변수 GEMINI_API_KEY를 확인해주세요')
    console.log('https://aistudio.google.com/app/apikey 에서 API 키를 발급받으세요')
    process.exit(1)
  }
}

main()
