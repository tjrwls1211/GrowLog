import Link from 'next/link'
import Card from '@/components/ui/Card'

export default function PostNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-20">
      <Card className="p-12 text-center">
        <div className="mb-6 text-6xl">📝</div>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          글을 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-[var(--color-foreground)]/70">
          요청하신 글이 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            홈으로 돌아가기
          </Link>
          <Link href="/posts" className="btn btn-outline">
            전체 글 보기
          </Link>
        </div>
      </Card>
    </div>
  )
}
