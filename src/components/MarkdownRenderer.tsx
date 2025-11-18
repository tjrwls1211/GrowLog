import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
