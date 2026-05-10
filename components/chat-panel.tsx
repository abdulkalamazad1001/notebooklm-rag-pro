"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Sparkles, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageItem } from "@/components/chat-message"
import { cn } from "@/lib/utils"
import type { ChatMessage, Notebook, Source } from "@/lib/types"

type Props = {
  notebook: Notebook | null
}

const SUGGESTED_PROMPTS = [
  "Summarize this document in 3 bullet points",
  "What are the key takeaways from this text?",
  "List any potential risks or limitations mentioned.",
  "How does this compare to existing research?",
]

export function ChatPanel({ notebook }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset chat when notebook changes/clears.
  useEffect(() => {
    setMessages([])
    setInput("")
  }, [notebook?.id])

  // Auto-scroll to bottom on new content.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  async function send(prompt: string) {
    const text = prompt.trim()
    if (!text || !notebook || isStreaming) return

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    }
    const assistantId = `a_${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      pending: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: notebook.id,
          notebook: notebook, // Send the full notebook including chunks for stateless deploy
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? "Request failed")
      }

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let headerParsed = false
      let sources: Source[] = []
      let answer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        if (!headerParsed) {
          const sep = buffer.indexOf("\n\n---\n\n")
          if (sep === -1) continue
          const headerStr = buffer.slice(0, sep)
          buffer = buffer.slice(sep + "\n\n---\n\n".length)
          try {
            const parsed = JSON.parse(headerStr) as {
              type: string
              sources: Source[]
            }
            sources = parsed.sources ?? []
          } catch {
            // ignore
          }
          headerParsed = true
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sources, pending: true } : m,
            ),
          )
        }

        if (headerParsed && buffer.length > 0) {
          answer += buffer
          buffer = ""
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: answer, sources, pending: false }
                : m,
            ),
          )
        }
      }

      // Final flush
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: answer.trim() || m.content, pending: false }
            : m,
        ),
      )
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, content: m.content || "(stopped)" }
              : m,
          ),
        )
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong"
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, content: `Sorry — ${message}` }
              : m,
          ),
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          Chat
          {notebook && (
            <span className="text-muted-foreground font-normal hidden sm:inline">
              Asking questions about {notebook.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          llama-3.1-70b
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {messages.length === 0 ? (
          <EmptyState
            disabled={!notebook}
            onPick={(p) => {
              setInput(p)
              if (notebook) send(p)
            }}
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((m) => (
              <ChatMessageItem key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
          <div
            className={cn(
              "flex items-center rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg shadow-black/40 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40",
              !notebook && "opacity-60",
            )}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!notebook}
              placeholder={
                notebook
                  ? "Ask anything about your document..."
                  : "Upload a document in the sidebar first"
              }
              className="flex-1 bg-transparent px-2 text-sm outline-none disabled:cursor-not-allowed"
            />
            {isStreaming ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={stop}
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="secondary"
                size="icon"
                disabled={!notebook || !input.trim()}
                className="h-8 w-8"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            Answers are grounded in retrieved excerpts and may still contain mistakes.
          </div>
        </form>
      </div>
    </section>
  )
}

function EmptyState({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (prompt: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">
        Ready to dive in?
      </h3>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Upload a PDF or text file to get started. You can ask for summaries,
        clarifications, or deep dives into specific topics.
      </p>

      <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left text-xs transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="line-clamp-1">{p}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
