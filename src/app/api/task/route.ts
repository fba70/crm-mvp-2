import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sessionUserId = session.user.id
  const urlUserId = req.nextUrl.searchParams.get("userId")

  if (!urlUserId || urlUserId !== sessionUserId) {
    return NextResponse.json(
      { error: "Forbidden: user mismatch" },
      { status: 403 },
    )
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { createdById: urlUserId },
        { assignedToId: urlUserId },
        { transferToId: urlUserId },
        { collaborators: { some: { id: urlUserId } } },
      ],
    },
    include: {
      client: true,
      contact: true,
      createdBy: true,
      assignedTo: true,
      linkedTasks: true,
      transferTo: true,
      collaborators: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // If date is present and is a string, convert to ISO string
    if (data.date) {
      data.date = new Date(data.date).toISOString()
    }

    const newTask = await prisma.task.create({
      data,
    })
    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error("Task create error", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    )
  }
}
