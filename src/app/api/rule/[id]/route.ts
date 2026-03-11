import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

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
    const { title, category, content } = await req.json()

    const rule = await prisma.rule.update({
      where: { id, userId: session.user.id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
      },
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error("Error updating rule:", error)
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.rule.delete({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting rule:", error)
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}
