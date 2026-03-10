import { after } from "next/server"
import { bot } from "@/lib/bot-slack"
import { slackSSE } from "@/lib/slack-sse"

export async function POST(request: Request) {
  return bot.webhooks.slack(request, {
    waitUntil: (task) =>
      after(async () => {
        await task
        slackSSE.broadcast("refresh")
      }),
  })
}
