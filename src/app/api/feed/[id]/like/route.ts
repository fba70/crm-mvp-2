import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/get-session"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = await params

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: userId,
        feedId: id,
      },
    })

    if (existingLike) {
      return NextResponse.json({ message: "Already liked" })
    }

    await prisma.like.create({
      data: {
        userId: userId,
        feedId: id,
      },
    })

    return NextResponse.json({ message: "Liked successfully" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const likeCount = await prisma.like.count({
      where: {
        feedId: id,
      },
    })

    return NextResponse.json({ likeCount })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
