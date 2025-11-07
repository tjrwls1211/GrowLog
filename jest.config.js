const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // 테스트 환경 설정 파일일
  testEnvironment: 'jest-environment-jsdom', 
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', //절대 경로를 설정하기 위한 경로 매핑핑
  },
  testMatch: [ 
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ], // 테스트 파일 패턴 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ], // 코드 커버리지 수집 대상 설정, npm run test:coverage 명령어로 실행
}

module.exports = createJestConfig(customJestConfig)
