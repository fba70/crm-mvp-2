import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        tasks: true, // Include related tasks
        feeds: true, // Include related feeds
        contacts: true, // Include related contacts
      },
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(client)
  } catch (error) {
    console.log("Client fetch error", error)
    return NextResponse.json(
      { error: "Failed to fetch client" },
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
    const updatedClient = await prisma.client.update({
      where: { id },
      data,
    })
    return NextResponse.json(updatedClient)
  } catch (error) {
    console.log("Client update error", error)
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
    )
  }
}
