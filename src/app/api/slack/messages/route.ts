import { NextResponse } from "next/server"
import { bot } from "@/lib/bot-slack"

const MAX_MESSAGES = 30

export async function GET() {
  const channelId = process.env.SLACK_CHANNEL_ID
  if (!channelId) {
    return NextResponse.json({ error: "SLACK_CHANNEL_ID is not set" }, { status: 500 })
  }

  const messages: {
    threadId: string
    text: string
    authorName: string
    isBot: boolean
    isMe: boolean
    dateSent: string
  }[] = []

  let count = 0
  for await (const msg of bot.channel(`slack:${channelId}`).messages) {
    messages.push({
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

  // messages come newest-first from the iterator, reverse for chronological display
  return NextResponse.json({ messages: messages.reverse() })
}
