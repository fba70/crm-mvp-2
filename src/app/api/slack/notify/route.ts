import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"

const PRIORITY_EMOJI: Record<string, string> = {
  HIGH: "★",
  NORMAL: "",
}

const CATEGORY_LABEL: Record<string, string> = {
  RECOMMENDATION: "Recommendation",
  CLIENT_ACTIVITY: "Client Activity",
  INDUSTRY_INFO: "Industry Info",
  COLLEAGUES_UPDATE: "Colleagues Update",
}

interface NotifyBody {
  id: string
  priority: "HIGH" | "NORMAL"
  category: string
  message: { analysis: string; recommendation: string }
  clients: { id: string; name: string }[]
  sources: { id: string; source: string; channelId: string }[]
  createdAt: string
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const webhookUrl = process.env.SLACK_TRUFFLE_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "SLACK_TRUFFLE_WEBHOOK_URL is not set" },
      { status: 500 },
    )
  }

  const card: NotifyBody = await req.json()

  const priorityEmoji = PRIORITY_EMOJI[card.priority] ?? "⚪"
  const priorityLabel = card.priority === "HIGH" ? "High" : "Normal"
  const categoryLabel = CATEGORY_LABEL[card.category] ?? card.category
  const clientName = card.clients[0]?.name ?? null
  const sourceSummary = card.sources
    .map((s) => `${s.source}/${s.channelId}`)
    .join(", ")

  const headerText = card.priority === "HIGH"
    ? `Truffle Card — ${priorityEmoji} ${priorityLabel} Priority`
    : `Truffle Card — ${priorityLabel} Priority`

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: headerText,
        emoji: false,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Category*\n${categoryLabel}`,
        },
        ...(clientName
          ? [{ type: "mrkdwn", text: `*Client*\n${clientName}` }]
          : []),
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Analysis*\n${card.message.analysis}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Recommendation*\n${card.message.recommendation}`,
      },
    },
    ...(sourceSummary
      ? [
          { type: "divider" },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Sources: ${sourceSummary}`,
              },
            ],
          },
        ]
      : []),
  ]

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `Truffle Card — ${priorityLabel} Priority | ${categoryLabel}${clientName ? ` | ${clientName}` : ""}`,
      blocks,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: `Slack error: ${text}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
