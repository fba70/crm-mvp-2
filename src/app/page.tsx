import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
// import { CalendarCheck } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-8 flex items-center justify-center gap-4">
          <Image
            src="/T_logo.jpg"
            alt="TRUFFALO Logo"
            width={400}
            height={400}
          />
        </div>
        <h1 className="mb-16 text-2xl font-semibold sm:text-4xl">
          YOUR AGENTIC CRM APP
        </h1>
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-5 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
