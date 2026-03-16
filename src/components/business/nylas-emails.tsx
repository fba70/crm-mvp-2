"use client"

import { cn } from "@/lib/utils"
import { MailIcon, RefreshCwIcon, StarIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface NylasMessage {
  id: string
  subject: string
  from: string
  fromName: string | null
  snippet: string
  date: string | null
  unread: boolean
  starred: boolean
}

const formatDate = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" })
}

const EmailRow = ({ message }: { message: NylasMessage }) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50",
      message.unread && "bg-muted/30",
    )}
  >
    <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
      <MailIcon
        className={cn(
          "size-4",
          message.unread ? "text-foreground" : "text-muted-foreground",
        )}
      />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "truncate text-sm",
            message.unread ? "font-semibold" : "font-medium text-muted-foreground",
          )}
        >
          {message.fromName ?? message.from}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatDate(message.date)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {message.starred && (
          <StarIcon className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
        <span
          className={cn(
            "truncate text-sm",
            message.unread ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {message.subject}
        </span>
      </div>

      {message.snippet && (
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {message.snippet}
        </p>
      )}
    </div>
  </div>
)

const NylasEmails = () => {
  const [messages, setMessages] = useState<NylasMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchMessages = useCallback(
    async (opts: { isManual?: boolean; pageToken?: string; append?: boolean } = {}) => {
      const { isManual = false, pageToken, append = false } = opts
      if (isManual) setRefreshing(true)
      if (append) setLoadingMore(true)

      try {
        const url = new URL("/api/nylas/messages", window.location.origin)
        if (pageToken) url.searchParams.set("pageToken", pageToken)

        const res = await fetch(url.toString())
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? "Failed to fetch emails")
        }

        const data: { messages: NylasMessage[]; nextPageToken: string | null } =
          await res.json()

        setNextPageToken(data.nextPageToken)

        if (append) {
          setMessages((prev) => [...prev, ...data.messages])
        } else {
          setMessages(data.messages)
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
        if (isManual) setRefreshing(false)
        if (append) setLoadingMore(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return (
    <div className="relative mt-4 flex size-full max-h-[700px] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">Inbox</span>

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs disabled:opacity-50"
          disabled={refreshing}
          onClick={() => fetchMessages({ isManual: true })}
        >
          <RefreshCwIcon className={cn("size-3", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-dashed shadow-sm">
        {loading && (
          <div className="text-muted-foreground flex h-full items-center justify-center py-16 text-sm">
            Loading emails…
          </div>
        )}

        {error && (
          <div className="text-destructive flex h-full items-center justify-center py-16 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center py-16 text-sm">
            No emails found
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="flex flex-col divide-y">
            {messages.map((msg) => (
              <EmailRow key={msg.id} message={msg} />
            ))}

            {nextPageToken && (
              <div className="flex justify-center py-3">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                  disabled={loadingMore}
                  onClick={() =>
                    fetchMessages({ append: true, pageToken: nextPageToken })
                  }
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NylasEmails
