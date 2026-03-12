"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  BotIcon,
  RefreshCwIcon,
  SaveIcon,
  TimerIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface SlackMessage {
  messageId: string // Slack ts — unique ID and sort anchor
  threadId: string
  text: string
  authorName: string
  isBot: boolean
  isMe: boolean
  dateSent: string
}

type Mode = "polling" | "webhook"

const POLL_INTERVAL_MS = 60_000
const LATEST_TS_KEY = "slack_chat_latest_ts"

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const MessageCard = ({ message }: { message: SlackMessage }) => (
  <div
    className={cn("flex gap-3", message.isMe ? "flex-row-reverse" : "flex-row")}
  >
    <div className="bg-muted mt-1 flex size-8 shrink-0 items-center justify-center rounded-full">
      {message.isBot || message.isMe ? (
        <BotIcon className="text-muted-foreground size-4" />
      ) : (
        <UserIcon className="text-muted-foreground size-4" />
      )}
    </div>
    <div
      className={cn(
        "flex max-w-[75%] flex-col gap-1",
        message.isMe && "items-end",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium">{message.authorName}</span>
        <span className="text-muted-foreground text-xs">
          {formatTime(message.dateSent)}
        </span>
      </div>
      <Card
        className={cn(
          "shadow-none",
          message.isMe && "bg-primary text-primary-foreground",
        )}
      >
        <CardContent className="px-3 text-sm whitespace-pre-wrap">
          {message.text}
        </CardContent>
      </Card>
    </div>
  </div>
)

const SlackChat = () => {
  const [mode, setMode] = useState<Mode>("polling")
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sseStatus, setSseStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected")
  const bottomRef = useRef<HTMLDivElement>(null)
  // Slack ts of the newest message seen — used as fetch cursor.
  // Persisted to localStorage so it survives page refreshes.
  const latestTsRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(LATEST_TS_KEY) : null,
  )

  const persistLatestTs = useCallback((ts: string) => {
    latestTsRef.current = ts
    localStorage.setItem(LATEST_TS_KEY, ts)
  }, [])

  // append=false → replace full list (no cursor used)
  // append=true  → fetch only messages newer than latestTsRef and append
  const fetchMessages = useCallback(
    async (opts: { isManual?: boolean; append?: boolean } = {}) => {
      const { isManual = false, append = false } = opts
      if (isManual) setRefreshing(true)

      try {
        const url = new URL("/api/slack/messages", window.location.origin)
        if (append && latestTsRef.current) {
          url.searchParams.set("oldest", latestTsRef.current)
        }

        const res = await fetch(url.toString())
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? "Failed to fetch messages")
        }

        const data: {
          messages: SlackMessage[]
          newestTs: string | null
          channelId: string
        } = await res.json()

        if (data.channelId) setChannelId(data.channelId)

        // Advance the persisted cursor to the newest ts in this batch
        if (data.newestTs) {
          persistLatestTs(data.newestTs)
        }

        if (append) {
          if (data.messages.length > 0) {
            setMessages((prev) => [...prev, ...data.messages])
          }
        } else {
          setMessages(data.messages)
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
        if (isManual) setRefreshing(false)
      }
    },
    [persistLatestTs],
  )

  // Polling mode: initial load respects saved cursor, then appends every 15 s
  useEffect(() => {
    if (mode !== "polling") return
    // If a cursor exists from a previous save, fetch only newer messages.
    // If no cursor, do a full load.
    fetchMessages({ append: !!latestTsRef.current })
    const interval = setInterval(
      () => fetchMessages({ append: true }),
      POLL_INTERVAL_MS,
    )
    return () => clearInterval(interval)
  }, [mode, fetchMessages])

  // Webhook mode: initial replace-load + SSE-driven append
  useEffect(() => {
    if (mode !== "webhook") return

    fetchMessages({ append: !!latestTsRef.current })

    setSseStatus("connecting")
    const es = new EventSource("/api/slack/stream")

    es.onopen = () => setSseStatus("connected")
    es.onmessage = (event) => {
      if (event.data === "refresh") {
        fetchMessages({ append: true })
      }
    }
    es.onerror = () => {
      setSseStatus("disconnected")
      es.close()
    }

    return () => {
      es.close()
      setSseStatus("disconnected")
    }
  }, [mode, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleModeSwitch = (next: Mode) => {
    if (next === mode) return
    setMessages([])
    setLoading(true)
    setError(null)
    latestTsRef.current = null
    setMode(next)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "slack",
          channelId: channelId ?? "unknown",
          fetchedAt: new Date().toISOString(),
          oldestTs: messages[0]?.messageId ?? null,
          newestTs: messages[messages.length - 1]?.messageId ?? null,
          messages: messages.map((m) => ({
            authorName: m.authorName,
            ts: m.messageId,
            text: m.text,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save")
      }
      // Clear the window — latestTsRef keeps the cursor so the next
      // Refresh/poll fetches only messages newer than what was just saved.
      setMessages([])
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative mt-4 flex size-full max-h-[700px] flex-col gap-3">
      {/* Save error */}
      {saveError && <div className="text-destructive text-xs">{saveError}</div>}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            Slack channel
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Mode toggle */}
          <div className="flex items-center rounded-md border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleModeSwitch("polling")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                mode === "polling"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TimerIcon className="size-3" />
              Polling
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("webhook")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                mode === "webhook"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ZapIcon className="size-3" />
              Webhook
            </button>
          </div>

          {/* Refresh — appends only new messages */}
          <button
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs disabled:opacity-50"
            disabled={refreshing}
            onClick={() => fetchMessages({ isManual: true, append: true })}
            type="button"
          >
            <RefreshCwIcon
              className={cn("size-3", refreshing && "animate-spin")}
            />
            Refresh
          </button>

          {/* Save to DB */}
          <button
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs disabled:opacity-50"
            disabled={messages.length === 0 || saving}
            onClick={handleSave}
            type="button"
          >
            <SaveIcon className={cn("size-3", saving && "animate-pulse")} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* SSE status badge (webhook mode only) */}
      {mode === "webhook" && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <div
            className={cn("size-1.5 rounded-full", {
              "animate-pulse bg-yellow-400": sseStatus === "connecting",
              "bg-green-500": sseStatus === "connected",
              "bg-destructive": sseStatus === "disconnected",
            })}
          />
          {sseStatus === "connecting" && "Connecting to live stream…"}
          {sseStatus === "connected" && "Live — updates pushed via webhook"}
          {sseStatus === "disconnected" &&
            "Stream disconnected — use Refresh to reload"}
        </div>
      )}

      {/* Messages */}
      <div className="max-h-[650px] min-h-0 flex-1 overflow-y-auto rounded-md border border-dashed p-4 shadow-sm">
        {loading && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Loading messages…
          </div>
        )}
        {error && (
          <div className="text-destructive flex h-full items-center justify-center text-sm">
            {error}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No messages yet
          </div>
        )}
        {!loading && !error && messages.length > 0 && (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageCard key={msg.messageId} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default SlackChat
