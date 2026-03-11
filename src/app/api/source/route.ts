import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sources = await prisma.source.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(sources)
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { source, channelId, fetchedAt, oldestTs, newestTs, messages } = body

    if (!source || !channelId || !messages) {
      return NextResponse.json(
        { error: "source, channelId, and messages are required" },
        { status: 400 },
      )
    }

    const record = await prisma.source.create({
      data: {
        source,
        channelId,
        fetchedAt: fetchedAt ? new Date(fetchedAt) : new Date(),
        oldestTs: oldestTs ?? null,
        newestTs: newestTs ?? null,
        messages,
        userId: session.user.id,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Error saving source:", error)
    return NextResponse.json({ error: "Failed to save source" }, { status: 500 })
  }
}
