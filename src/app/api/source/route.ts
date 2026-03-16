import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const processedParam = searchParams.get("processed")

  const where: { userId: string; processed?: boolean } = {
    userId: session.user.id,
  }
  if (processedParam === "false") where.processed = false
  else if (processedParam === "true") where.processed = true

  const sources = await prisma.source.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(sources)
}

export async function PATCH(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { sourceIds, processed }: { sourceIds: string[]; processed: boolean } =
      await req.json()

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json({ error: "sourceIds is required" }, { status: 400 })
    }

    await prisma.source.updateMany({
      where: { id: { in: sourceIds }, userId: session.user.id },
      data: { processed },
    })

    return NextResponse.json({ updated: sourceIds.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id }: { id: string } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    await prisma.source.delete({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ deleted: id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
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
