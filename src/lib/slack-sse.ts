// In-memory SSE pub/sub for Slack webhook → client notifications.
// NOTE: Works within a single server instance. On Vercel multi-instance
// deployments the webhook and SSE connection may land on different instances;
// polling mode is a reliable fallback in that case.
type Subscriber = (data: string) => void

const subscribers = new Set<Subscriber>()

export const slackSSE = {
  subscribe(fn: Subscriber): () => void {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  },
  broadcast(data: string) {
    subscribers.forEach((fn) => {
      try {
        fn(data)
      } catch {
        // connection closed — will be cleaned up on stream cancel
      }
    })
  },
  get size() {
    return subscribers.size
  },
}
