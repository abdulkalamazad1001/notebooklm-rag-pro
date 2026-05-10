"use client"

import { useState } from "react"
import { BookOpen, Menu, X } from "lucide-react"
import { ChatPanel } from "@/components/chat-panel"
import { SourcePanel } from "@/components/source-panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Notebook } from "@/lib/types"

/**
 * Core Application Shell
 * Manages the shared state between the source upload panel and the chat interface.
 */
export function NotebookApp() {
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <main className="relative flex flex-1 overflow-hidden min-h-0">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transform bg-sidebar transition-transform duration-300 ease-in-out md:relative md:z-0 md:w-[320px] md:translate-x-0 lg:w-[360px]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SourcePanel
            notebook={notebook}
            onUploaded={(nb) => {
              setNotebook(nb)
              setIsSidebarOpen(false) // Auto-close on mobile after upload
            }}
            onClear={() => setNotebook(null)}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatPanel notebook={notebook} />
        </div>
      </main>
    </div>
  )
}

function TopBar({ onMenuClick, isSidebarOpen }: { onMenuClick: () => void, isSidebarOpen: boolean }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onMenuClick}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Notebook RAG</span>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        GitHub
      </a>
    </header>
  )
}
