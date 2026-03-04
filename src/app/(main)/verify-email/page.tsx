import type { Metadata } from "next"
import { ResendVerificationButton } from "./resend-verification-button"
import { getServerSession } from "@/lib/get-session"
import { redirect, unauthorized } from "next/navigation"

export const metadata: Metadata = {
  title: "Verify Email",
}

export default async function VerifyEmailPage() {
  const session = await getServerSession()
  const user = session?.user

  if (!user) {
    unauthorized()
  }

  if (user.emailVerified) {
    redirect("/dashboard")
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 text-center">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Verify your email</h1>
          <p className="text-muted-foreground">
            A verification email was sent to your inbox.
          </p>
        </div>
        <ResendVerificationButton email={user.email} />
      </div>
    </main>
  )
}
