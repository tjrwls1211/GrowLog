'use client'

import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function LogoutButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const modal = isModalOpen ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-[var(--color-background)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">로그아웃</h2>
        <p className="text-[var(--color-foreground)]/70 mb-6">
          정말 로그아웃 하시겠습니까?
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="btn btn-outline flex-1"
          >
            취소
          </button>
          <button onClick={handleLogout} className="btn btn-primary flex-1">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-outline btn--md"
      >
        로그아웃
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  )
}
