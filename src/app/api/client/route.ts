import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/get-session"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        tasks: true, // Include related tasks
        feeds: true, // Include related feeds
        contacts: true, // Include related contacts
      },
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
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

    const newClient = await prisma.client.create({ data })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Client create error", error)
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    )
  }
}
