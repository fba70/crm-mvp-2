import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        contact: true,
        createdBy: true,
        assignedTo: true,
        linkedTasks: true,
        collaborators: true,
      },
    })
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    return NextResponse.json(task)
  } catch (error) {
    console.log("Task fetch error", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  const data = await req.json()

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    })
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.log("Task update error", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    )
  }
}
