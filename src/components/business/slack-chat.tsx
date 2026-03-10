"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BotIcon, RefreshCwIcon, UserIcon, ZapIcon, TimerIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface SlackMessage {
  threadId: string
  text: string
  authorName: string
  isBot: boolean
  isMe: boolean
  dateSent: string
}

type Mode = "polling" | "webhook"

const POLL_INTERVAL_MS = 15_000

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const MessageCard = ({ message }: { message: SlackMessage }) => (
  <div
    className={cn(
      "flex gap-3",
      message.isMe ? "flex-row-reverse" : "flex-row",
    )}
  >
    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
      {message.isBot || message.isMe ? (
        <BotIcon className="size-4 text-muted-foreground" />
      ) : (
        <UserIcon className="size-4 text-muted-foreground" />
      )}
    </div>
    <div className={cn("flex max-w-[75%] flex-col gap-1", message.isMe && "items-end")}>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium">{message.authorName}</span>
        <span className="text-xs text-muted-foreground">{formatTime(message.dateSent)}</span>
      </div>
      <Card className={cn("shadow-none", message.isMe && "bg-primary text-primary-foreground")}>
        <CardContent className="px-3 py-2 text-sm whitespace-pre-wrap">{message.text}</CardContent>
      </Card>
    </div>
  </div>
)

const SlackChat = () => {
  const [mode, setMode] = useState<Mode>("polling")
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [sseStatus, setSseStatus] = useState<"connecting" | "connected" | "disconnected">(
    "disconnected",
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)

  const fetchMessages = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch("/api/slack/messages")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to fetch messages")
      }
      const data: { messages: SlackMessage[] } = await res.json()
      setMessages(data.messages)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }, [])

  // Polling mode
  useEffect(() => {
    if (mode !== "polling") return
    fetchMessages()
    const interval = setInterval(() => fetchMessages(), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [mode, fetchMessages])

  // Webhook / SSE mode
  useEffect(() => {
    if (mode !== "webhook") return

    setLoading(true)
    fetchMessages()

    setSseStatus("connecting")
    const es = new EventSource("/api/slack/stream")
    sseRef.current = es

    es.onopen = () => setSseStatus("connected")

    es.onmessage = (event) => {
      if (event.data === "refresh") {
        fetchMessages()
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
    // Reset state when switching modes
    setMessages([])
    setLoading(true)
    setError(null)
    setMode(next)
  }

  return (
    <div className="relative mt-4 flex size-full flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full",
              mode === "webhook" && sseStatus === "connected" ? "bg-green-500" : "bg-green-500",
            )}
          />
          <span className="text-sm font-medium text-muted-foreground">Slack channel</span>
        </div>

        <div className="flex items-center gap-3">
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

          {/* Refresh button */}
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            disabled={refreshing}
            onClick={() => fetchMessages(true)}
            type="button"
          >
            <RefreshCwIcon className={cn("size-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* SSE status badge */}
      {mode === "webhook" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div
            className={cn("size-1.5 rounded-full", {
              "bg-yellow-400 animate-pulse": sseStatus === "connecting",
              "bg-green-500": sseStatus === "connected",
              "bg-destructive": sseStatus === "disconnected",
            })}
          />
          {sseStatus === "connecting" && "Connecting to live stream…"}
          {sseStatus === "connected" && "Live — updates pushed via webhook"}
          {sseStatus === "disconnected" && "Stream disconnected — use Refresh to reload"}
        </div>
      )}

      {/* Messages */}
      <div className="max-h-[400px] min-h-0 flex-1 overflow-y-auto rounded-md border border-dashed p-4 shadow-sm">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading messages…
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet
          </div>
        )}
        {!loading && !error && messages.length > 0 && (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageCard key={`${msg.threadId}-${msg.dateSent}`} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default SlackChat
