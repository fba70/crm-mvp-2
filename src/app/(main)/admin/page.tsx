import type { Metadata } from "next"
import { DeleteApplication } from "./delete-application"
import { getServerSession } from "@/lib/get-session"
import { unauthorized, forbidden } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin",
}

export default async function AdminPage() {
  const session = await getServerSession()
  const user = session?.user

  if (!user) {
    unauthorized()
  }

  if (user.role !== "admin") {
    forbidden()
  }

  // BETTER-AUTH has admin() plugin out-of-the-box to manage adin user functions

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-muted-foreground">
            You have administrator access.
          </p>
        </div>
        <DeleteApplication />
      </div>
    </main>
  )
}
