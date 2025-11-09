'use client'

import { signIn } from 'next-auth/react'

export default function SignInPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px'
    }}>
      <h1>GrowLog 로그인</h1>
      <button
        onClick={() => signIn('google')}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Google로 로그인
      </button>
    </div>
  )
}
