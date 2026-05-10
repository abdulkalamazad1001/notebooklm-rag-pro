"use client"

import { useRef, useState } from "react"
import { FileText, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Notebook } from "@/lib/types"

type Props = {
  notebook: Notebook | null
  onUploaded: (nb: Notebook) => void
  onClear: () => void
}

export function SourcePanel({ notebook, onUploaded, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Upload failed")
      onUploaded(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setError(message)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-medium tracking-tight">Sources</h2>
        </div>
        {notebook && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Remove document</span>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {!notebook ? (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/60 hover:bg-muted/40",
              isUploading && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="text-sm font-medium">Indexing document…</div>
                <div className="text-xs text-muted-foreground text-balance">
                  Extracting text, splitting into chunks, and creating embeddings.
                </div>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">Upload a document</div>
                <div className="text-xs text-muted-foreground text-balance">
                  Drop a PDF, CSV, or .txt file here, or click to browse. Up to 20&nbsp;MB.
                </div>
              </>
            )}
          </label>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card/50 p-4 transition-all hover:ring-1 hover:ring-primary/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium" title={notebook.name}>
                    {notebook.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {notebook.chunkCount} chunks · {Math.round(notebook.totalChars / 1000)}k chars
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <div className="mb-1 font-medium text-foreground">How it works</div>
              Your document was chunked with a recursive character splitter (~900 chars,
              150 overlap), embedded with{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-[10px]">
                nv-embedqa-e5-v5
              </code>
              , and stored in an in-memory vector index. Each question runs cosine
              similarity against the index to retrieve the top 5 chunks.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
            {error}
          </div>
        )}
      </div>

      <footer className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        Powered by Abdul kalam
      </footer>
    </aside>
  )
}
