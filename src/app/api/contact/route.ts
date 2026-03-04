import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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

    const newContact = await prisma.contact.create({ data })

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error("Contact create error", error)
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 },
    )
  }
}
