'use client'

import { signIn } from 'next-auth/react'
import { useEffect } from 'react'

export default function SignInPage() {
  useEffect(() => {
    signIn('google', { callbackUrl: '/' })
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px'
    }}>
      <p>Google 로그인으로 이동 중...</p>
    </div>
  )
}
