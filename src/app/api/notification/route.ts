import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Extract the userId from the query parameters
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    // Fetch notifications with optional filtering
    const notifications = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { recipientId: userId || null }, // Filter by recipientId if userId is provided
              { recipientId: null }, // Include notifications with recipientId = null
            ],
          },
          { read: false }, // Only fetch notifications where read = false
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: true,
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const newNotification = await prisma.notification.create({ data })

    return NextResponse.json(newNotification, { status: 201 })
  } catch (error) {
    console.error("Notification create error", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    )
  }
}
