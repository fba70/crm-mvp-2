import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rules = await prisma.rule.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json(rules)
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, category, content } = await req.json()

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "title, category, and content are required" },
        { status: 400 },
      )
    }

    const rule = await prisma.rule.create({
      data: { title, category, content, userId: session.user.id },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error("Error creating rule:", error)
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 })
  }
}
