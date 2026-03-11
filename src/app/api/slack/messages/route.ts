import { NextResponse } from "next/server"
import { bot } from "@/lib/bot-slack"

const MAX_MESSAGES = 30

export async function GET(request: Request) {
  const channelId = process.env.SLACK_CHANNEL_ID
  if (!channelId) {
    return NextResponse.json({ error: "SLACK_CHANNEL_ID is not set" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  // Slack ts of the newest message already held by the client.
  // When present, only messages with ts > oldest are returned (incremental fetch).
  const oldest = searchParams.get("oldest")

  const messages: {
    messageId: string // Slack ts — unique message ID and sort key
    threadId: string
    text: string
    authorName: string
    isBot: boolean
    isMe: boolean
    dateSent: string
  }[] = []

  let count = 0
  for await (const msg of bot.channel(`slack:${channelId}`).messages) {
    // msg.id is the Slack ts (e.g. "1710123456.000123").
    // The iterator yields newest-first; stop when we reach already-seen messages.
    if (oldest && msg.id <= oldest) break

    messages.push({
      messageId: msg.id,
      threadId: msg.threadId,
      text: msg.text,
      authorName: msg.author.fullName,
      isBot: msg.author.isBot === true,
      isMe: msg.author.isMe,
      dateSent: msg.metadata.dateSent.toISOString(),
    })
    count++
    if (count >= MAX_MESSAGES) break
  }

  // Reverse to chronological order (oldest first).
  const reversed = messages.reverse()
  const newestTs = reversed.length > 0 ? reversed[reversed.length - 1].messageId : null

  return NextResponse.json({ messages: reversed, newestTs, channelId })
}
