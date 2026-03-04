import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"
import { FeedType, FeedStatus } from "@/types/entities"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const feed = await prisma.feed.findMany({
    include: {
      client: true,
    },
  })

  return NextResponse.json(feed)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      type,
      status,
      clientId,
      metadata,
      actionCall,
      actionEmail,
      actionBooking,
      actionTask,
    } = body

    if (!type || !status) {
      return NextResponse.json(
        { error: "Type and Status are required fields." },
        { status: 400 },
      )
    }

    // Create the new feed record
    const newFeed = await prisma.feed.create({
      data: {
        type: type as FeedType,
        status: status as FeedStatus,
        clientId: clientId || null,
        metadata: metadata,
        actionCall: actionCall || false,
        actionEmail: actionEmail || false,
        actionBooking: actionBooking || false,
        actionTask: actionTask || false,
      },
    })

    return NextResponse.json(newFeed, { status: 201 })
  } catch (error) {
    console.error("Error creating feed:", error)
    return NextResponse.json(
      { error: "Failed to create feed." },
      { status: 500 },
    )
  }
}
