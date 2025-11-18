import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks, remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold mt-8 mb-4 leading-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-bold mt-6 mb-3 leading-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-bold mt-5 mb-2 leading-tight">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xl font-bold mt-4 mb-2 leading-snug">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-lg font-bold mt-3 mb-2 leading-snug">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-base font-bold mt-3 mb-2 leading-snug">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-[var(--color-foreground)]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-[var(--color-foreground)]">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--primary)] pl-4 italic my-4 text-[var(--color-foreground)]/80">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const isInline = !className

            return isInline ? (
              <code className="bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--primary)]">
                {children}
              </code>
            ) : (
              <SyntaxHighlighter
                style={oneDark}
                language={language || 'text'}
                PreTag="div"
                className="rounded-lg my-4"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[var(--primary)] underline hover:text-[var(--primary)]/80 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-[var(--color-border)]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
