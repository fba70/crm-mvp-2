import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        sender: true,
      },
    })
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }
    return NextResponse.json(notification)
  } catch (error) {
    console.log("Notification fetch error", error)
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  const data = await req.json()

  try {
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data,
    })
    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.log("Notification update error", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    )
  }
}
