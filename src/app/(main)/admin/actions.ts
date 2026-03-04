"use server"

import { setTimeout } from "node:timers/promises"
import { getServerSession } from "@/lib/get-session"
import { unauthorized, forbidden } from "next/navigation"

export async function deleteApplication() {
  const session = await getServerSession()
  const user = session?.user

  if (!user) {
    unauthorized()
  }

  if (user.role !== "admin") {
    forbidden()
  }

  // Code to delete app...

  await setTimeout(800)
}
