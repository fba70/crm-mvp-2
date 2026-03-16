import type { Metadata } from "next"
import { getServerSession } from "@/lib/get-session"
import { unauthorized } from "next/navigation"
import ElementsChat from "@/components/business/elements-chat"
import SlackChat from "@/components/business/slack-chat"
import SourcesAnalysis from "@/components/business/sources-analysis"
import RulesEditor from "@/components/business/rules-editor"
import CardsPopUp from "@/components/business/cards-pop-up"
import NylasEmails from "@/components/business/nylas-emails"
import { Separator } from "@/components/ui/separator"

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

        <div className="flex flex-row items-start justify-center gap-8">
          <div className="mt-4 w-[50%]">
            <h2 className="text-xl font-semibold">1. Web and LLM search</h2>
            <ElementsChat />
          </div>

          <div className="mt-4 w-[45%]">
            <h2 className="text-xl font-semibold">2. Slack chat</h2>
            <SlackChat />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">3. Emails</h2>
          <NylasEmails />
        </div>

        <Separator className="mt-4 bg-gradient-to-r from-blue-200 to-fuchsia-200 pt-1" />

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Sources analysis</h2>
          <SourcesAnalysis />
        </div>

        <Separator className="mt-4 bg-gradient-to-r from-blue-200 to-fuchsia-200 pt-1" />

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Rules editor</h2>
          <RulesEditor />
        </div>

        <Separator className="mt-4 bg-gradient-to-r from-blue-200 to-fuchsia-200 pt-1" />

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Cards pop-up</h2>
          <CardsPopUp />
        </div>
      </div>
    </main>
  )
}
