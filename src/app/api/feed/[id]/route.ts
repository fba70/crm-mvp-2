import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const feedItem = await prisma.feed.findUnique({
      where: { id },
      include: {
        client: true,
      },
    })
    if (!feedItem) {
      return NextResponse.json(
        { error: "Feed item not found" },
        { status: 404 },
      )
    }
    return NextResponse.json(feedItem)
  } catch (error) {
    console.log("Feed item fetch error", error)
    return NextResponse.json(
      { error: "Failed to fetch feed item" },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const body = await req.json() // Parse the request body for the update payload

    const updatedFeedItem = await prisma.feed.update({
      where: { id },
      data: body, // Use the payload to update the feed item
    })

    return NextResponse.json(updatedFeedItem)
  } catch (error) {
    console.log("Feed item update error", error)
    return NextResponse.json(
      { error: "Failed to update feed item" },
      { status: 500 },
    )
  }
}
