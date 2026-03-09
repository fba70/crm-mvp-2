import type { Metadata } from "next"
import { getServerSession } from "@/lib/get-session"
import { unauthorized } from "next/navigation"
import ElementsChat from "@/components/business/elements-chat"
import SlackChat from "@/components/business/slack-chat"

export const metadata: Metadata = {
  title: "Sources",
}

export default async function SourcesPage() {
  const session = await getServerSession()
  const user = session?.user

  if (!user) {
    unauthorized()
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Sources</h1>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Web and LLM search</h2>
          <ElementsChat />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Slack chat</h2>
          <SlackChat />
        </div>
      </div>
    </main>
  )
}
