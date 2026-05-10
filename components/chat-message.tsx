"use client"

import { useState } from "react"
import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageType, Source } from "@/lib/types"

type Props = {
  message: ChatMessageType
}

export function ChatMessageItem({ message }: Props) {
  const [activeChunk, setActiveChunk] = useState<number | null>(null)
  const isUser = message.role === "user"

  // Replace [N] inline citations with clickable buttons.
  const rendered = isUser
    ? message.content
    : renderWithCitations(message.content, message.sources ?? [], (idx) =>
        setActiveChunk((prev) => (prev === idx ? null : idx)),
      )

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            isUser
              ? "bg-muted text-muted-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </div>

        <div
          className={cn(
            "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border",
          )}
        >
          {message.pending && !message.content ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:-200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:-100ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-pretty">{rendered}</div>
          )}
        </div>
      </div>

      {!isUser && activeChunk !== null && message.sources && (
        <SourcePreview
          source={message.sources.find((s) => s.index === activeChunk)}
          onClose={() => setActiveChunk(null)}
        />
      )}
    </div>
  )
}

function renderWithCitations(
  text: string,
  sources: Source[],
  onClick: (idx: number) => void,
): React.ReactNode {
  if (sources.length === 0) return text

  const validIndices = new Set(sources.map((s) => s.index))
  // Match [N] or [N, M] or [N,M, K]
  const regex = /\[((?:\d+\s*,\s*)*\d+)\]/g

  const out: React.ReactNode[] = []
  let lastEnd = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastEnd) {
      out.push(text.slice(lastEnd, match.index))
    }
    const nums = match[1]
      .split(",")
      .map((n) => Number.parseInt(n.trim(), 10))
      .filter((n) => Number.isFinite(n))

    out.push(
      <span key={`cite-${key++}`} className="inline-flex items-center gap-0.5">
        {nums.map((n, i) => {
          const valid = validIndices.has(n)
          return (
            <button
              key={`${n}-${i}`}
              type="button"
              onClick={() => valid && onClick(n)}
              disabled={!valid}
              className={cn(
                "inline-flex h-4 min-w-4 items-center justify-center rounded px-1 font-mono text-[10px] font-medium transition-all hover:scale-110 active:scale-95",
                valid
                  ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-default",
              )}
              title={valid ? `Show chunk ${n}` : `Chunk ${n} not retrieved`}
            >
              {n}
            </button>
          )
        })}
      </span>,
    )
    lastEnd = match.index + match[0].length
  }
  if (lastEnd < text.length) out.push(text.slice(lastEnd))
  return out
}

function SourcePreview({
  source,
  onClose,
}: {
  source: Source | undefined
  onClose: () => void
}) {
  if (!source) return null
  return (
    <div className="ml-10 max-w-[85%] rounded-md border border-primary/30 bg-primary/5 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="font-mono">Chunk {source.index}</span>
          <span className="text-muted-foreground">
            · relevance {source.score.toFixed(3)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
        {source.text}
      </div>
    </div>
  )
}
