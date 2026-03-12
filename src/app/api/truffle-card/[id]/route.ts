import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"
import { FeedStatus, FeedType, TruffleCardStatus } from "@/generated/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body: { accepted?: boolean; rejectionReason?: string } =
      await req.json()

    const existing = await prisma.truffleCard.findUnique({
      where: { id },
      include: { clients: { select: { id: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (body.accepted === true) {
      const feedType = existing.category as FeedType
      const clientId = existing.clients[0]?.id ?? null

      await prisma.feed.create({
        data: {
          type: feedType,
          status: FeedStatus.NEW,
          actionCall: true,
          actionEmail: true,
          actionBooking: true,
          actionTask: true,
          metadata: JSON.stringify(existing.message),
          ...(clientId && { clientId }),
        },
      })
    }

    const card = await prisma.truffleCard.update({
      where: { id },
      data: {
        ...(body.accepted === true && { accepted: true }),
        ...(body.rejectionReason && { rejectionReason: body.rejectionReason }),
        status: TruffleCardStatus.CLOSED,
      },
      include: {
        clients: { select: { id: true, name: true } },
        sources: { select: { id: true, source: true, channelId: true } },
      },
    })

    return NextResponse.json({ card, feedCreated: body.accepted === true })
  } catch (err) {
    console.error("[PATCH /api/truffle-card/:id]", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
