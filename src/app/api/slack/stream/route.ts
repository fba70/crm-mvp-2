import { slackSSE } from "@/lib/slack-sse"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: connected\n\n"))

      unsubscribe = slackSSE.subscribe((data) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      })

      // Keep the connection alive every 30 s
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode("data: heartbeat\n\n"))
      }, 30_000)
    },
    cancel() {
      unsubscribe?.()
      clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
