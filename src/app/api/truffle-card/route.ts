import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"
import { FeedType, TruffleCardPriority } from "@/generated/prisma"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cards = await prisma.truffleCard.findMany({
    where: {
      userId: session.user.id,
      status: "OPEN",
    },
    include: {
      clients: { select: { id: true, name: true } },
      sources: {
        select: {
          id: true,
          source: true,
          channelId: true,
          fetchedAt: true,
          messages: true,
        },
      },
      rule: { select: { id: true, title: true, category: true, content: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cards)
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const {
      priority,
      category,
      message,
      clientName,
      sourceIds,
      ruleId,
    }: {
      priority: TruffleCardPriority
      category: FeedType
      message: { analysis: string; recommendation: string }
      clientName: string | null
      sourceIds: string[]
      ruleId?: string
    } = await req.json()

    // Resolve client by name (case-insensitive) if provided
    let clientConnect: { id: string }[] = []
    if (clientName) {
      const matched = await prisma.client.findFirst({
        where: { name: { equals: clientName, mode: "insensitive" } },
        select: { id: true },
      })
      if (matched) clientConnect = [{ id: matched.id }]
    }

    const card = await prisma.truffleCard.create({
      data: {
        priority,
        category,
        message,
        userId: session.user.id,
        clients: { connect: clientConnect },
        sources: { connect: sourceIds.map((id) => ({ id })) },
        ...(ruleId && { ruleId }),
      },
      include: {
        clients: { select: { id: true, name: true } },
        sources: {
          select: {
            id: true,
            source: true,
            channelId: true,
            fetchedAt: true,
            messages: true,
          },
        },
        rule: { select: { id: true, title: true, category: true, content: true } },
      },
    })

    // Mark analysed sources as processed
    if (sourceIds.length > 0) {
      await prisma.source.updateMany({
        where: { id: { in: sourceIds } },
        data: { processed: true },
      })
    }

    return NextResponse.json(card, { status: 201 })
  } catch (err) {
    console.error("[truffle-card POST] error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
