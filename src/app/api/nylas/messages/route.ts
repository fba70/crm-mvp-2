import { NextResponse } from "next/server"
import nylas from "@/lib/nylas"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const apiKey = process.env.NYLAS_API_KEY
  const grantId = process.env.NYLAS_GRANT_ID

  if (!apiKey) {
    return NextResponse.json({ error: "NYLAS_API_KEY is not set" }, { status: 500 })
  }
  if (!grantId) {
    return NextResponse.json({ error: "NYLAS_GRANT_ID is not set" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const pageToken = searchParams.get("pageToken") ?? undefined

  try {
    const response = await nylas.messages.list({
      identifier: grantId,
      queryParams: {
        limit: PAGE_SIZE,
        in: ["INBOX"],
        ...(pageToken ? { pageToken } : {}),
      },
    })

    const messages = response.data.map((msg) => ({
      id: msg.id,
      subject: msg.subject ?? "(no subject)",
      from: msg.from?.[0]?.email ?? "unknown",
      fromName: msg.from?.[0]?.name ?? null,
      snippet: msg.snippet ?? "",
      date: msg.date ? new Date(msg.date * 1000).toISOString() : null,
      unread: msg.unread ?? false,
      starred: msg.starred ?? false,
    }))

    return NextResponse.json({
      messages,
      nextPageToken: response.nextCursor ?? null,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch emails"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
