'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type DeletePostButtonProps = {
  postId: number
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '삭제에 실패했습니다.')
      }

      router.push('/posts')
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.')
      setIsDeleting(false)
      setIsModalOpen(false)
    }
  }

  const modal = isModalOpen ? (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => !isDeleting && setIsModalOpen(false)}
    >
      <div
        className="bg-[var(--color-background)] rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">글 삭제</h2>
        <p className="text-[var(--color-foreground)]/70 mb-6">
          정말 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="btn btn-outline flex-1"
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="btn btn-outline btn--sm text-red-600 border-red-600 hover:bg-red-50"
      >
        삭제
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  )
}
