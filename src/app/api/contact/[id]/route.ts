import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
    })
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }
    return NextResponse.json(contact)
  } catch (error) {
    console.log("Contact fetch error", error)
    return NextResponse.json(
      { error: "Failed to fetch contact" },
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
    const updatedContact = await prisma.contact.update({
      where: { id },
      data,
    })
    return NextResponse.json(updatedContact)
  } catch (error) {
    console.log("Contact update error", error)
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 },
    )
  }
}
