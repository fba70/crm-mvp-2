"use client"

import { cn } from "@/lib/utils"
import { MailIcon, RefreshCwIcon, SaveIcon, StarIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

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

// localStorage key — stores ISO date of the newest saved email as the cursor.
// Emails with date <= this value are filtered out to avoid re-saving.
const LATEST_DATE_KEY = "nylas_emails_latest_date"

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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ISO date of the newest email that was already saved — used as dedup cursor.
  const latestSavedDateRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(LATEST_DATE_KEY) : null,
  )

  const filterUnsaved = useCallback((msgs: NylasMessage[]) => {
    const cursor = latestSavedDateRef.current
    if (!cursor) return msgs
    return msgs.filter((m) => m.date !== null && m.date > cursor)
  }, [])

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

        const fresh = filterUnsaved(data.messages)

        if (append) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            return [...prev, ...fresh.filter((m) => !existingIds.has(m.id))]
          })
        } else {
          setMessages(fresh)
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
    [filterUnsaved],
  )

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleSave = async () => {
    if (messages.length === 0) return
    setSaving(true)
    setSaveError(null)

    try {
      // Save each email as a separate source record
      await Promise.all(
        messages.map((msg) =>
          fetch("/api/source", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "email",
              channelId: "nylas",
              fetchedAt: new Date().toISOString(),
              oldestTs: msg.date,
              newestTs: msg.date,
              messages: [
                {
                  authorName: msg.fromName ?? msg.from,
                  ts: msg.id,
                  text: msg.snippet,
                },
              ],
            }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to save email ${msg.id}`)
          }),
        ),
      )

      // Advance cursor to the newest email's date
      const newestDate = messages
        .map((m) => m.date)
        .filter(Boolean)
        .sort()
        .at(-1)!

      latestSavedDateRef.current = newestDate
      localStorage.setItem(LATEST_DATE_KEY, newestDate)

      // Clear the list — cursor prevents them from reappearing on refresh
      setMessages([])
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative mt-4 flex size-full max-h-[700px] flex-col gap-3">
      {saveError && <div className="text-destructive text-xs">{saveError}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">Inbox</span>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs disabled:opacity-50"
            disabled={refreshing}
            onClick={() => fetchMessages({ isManual: true })}
          >
            <RefreshCwIcon className={cn("size-3", refreshing && "animate-spin")} />
            Refresh
          </button>

          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs disabled:opacity-50"
            disabled={messages.length === 0 || saving}
            onClick={handleSave}
          >
            <SaveIcon className={cn("size-3", saving && "animate-pulse")} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
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
            No new emails
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
