'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Tag from '@/components/ui/Tag'
import MarkdownRenderer from '@/components/MarkdownRenderer'

type PostEditorProps = {
  existingTags: string[]
}

export default function PostEditor({ existingTags }: PostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim()
    if (!trimmed) return
    if (selectedTags.includes(trimmed)) {
      setError('이미 추가된 태그입니다.')
      return
    }
    setSelectedTags([...selectedTags, trimmed])
    setTagInput('')
    setError('')
  }

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!title.trim()) {
        setError('제목을 입력해주세요.')
        return
      }

      if (!content.trim()) {
        setError('내용을 입력해주세요.')
        return
      }

      // 1. 포스트 생성
      const postResponse = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isPublic,
        }),
      })

      if (!postResponse.ok) {
        const data = await postResponse.json()
        throw new Error(data.error || '포스트 생성에 실패했습니다.')
      }

      const post = await postResponse.json()

      // 2. 태그 생성 및 연결
      if (selectedTags.length > 0) {
        for (const tagName of selectedTags) {
          // 기존 태그가 아니면 생성
          if (!existingTags.includes(tagName)) {
            await fetch('/api/tags', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: tagName }),
            }).catch(() => {
              // 이미 존재하는 태그면 무시
            })
          }

          // 태그 조회
          const tagResponse = await fetch(`/api/tags?name=${encodeURIComponent(tagName)}`)
          if (tagResponse.ok) {
            const tags = await tagResponse.json()
            const tag = tags.find((t: any) => t.name === tagName)

            if (tag) {
              // PostTag 연결
              await fetch('/api/post-tags', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  postId: post.id,
                  tagId: tag.id,
                }),
              })
            }
          }
        }
      }

      router.push(`/posts/${post.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSuggestions = existingTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !selectedTags.includes(tag)
  )

  return (
    <form onSubmit={handleSubmit} className="fixed inset-0 flex z-50 bg-[var(--color-background)]">
      {/* 왼쪽: 편집 영역 */}
      <div className="w-1/2 h-screen overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="p-8 space-y-6">
          {/* 헤더 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">새 글 쓰기</h1>
            <p className="text-sm text-[var(--color-foreground)]/70">
              학습한 내용을 기록하고 공유해보세요.
            </p>
          </div>

          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="학습한 내용의 제목을 입력하세요"
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--color-background)]"
              disabled={isSubmitting}
            />
          </div>

          {/* 태그 */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              태그
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="태그를 입력하고 Enter를 누르세요"
                  className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--color-background)]"
                  disabled={isSubmitting}
                />
                {tagInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="w-full px-4 py-2 text-left hover:bg-[var(--color-surface)] transition text-sm"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Tag
                      key={tag}
                      className="bg-[var(--primary)]/10 text-[var(--primary)] cursor-pointer hover:bg-[var(--primary)]/20 transition"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} ✕
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-[var(--primary)] border-[var(--color-border)] rounded focus:ring-[var(--primary)]"
              disabled={isSubmitting}
            />
            <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
              공개 글로 설정
            </label>
          </div>

          {/* 편집기 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              내용 (마크다운 지원)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="학습한 내용을 마크다운 형식으로 작성하세요..."
              className="w-full h-[calc(100vh-600px)] min-h-[300px] px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--color-background)] font-mono text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--color-background)] py-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '글 등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 미리보기 영역 */}
      <div className="w-1/2 h-screen overflow-y-auto bg-[var(--color-surface)]">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--color-foreground)]/70 mb-4">
              미리보기
            </h2>
            {title && (
              <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">
                {title}
              </h1>
            )}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTags.map((tag) => (
                  <Tag key={tag} className="bg-[var(--primary)]/10 text-[var(--primary)]">
                    #{tag}
                  </Tag>
                ))}
              </div>
            )}
          </div>
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-[var(--color-foreground)]/50">
              내용을 입력하면 미리보기가 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
