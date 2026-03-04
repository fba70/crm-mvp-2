import { CalendarCheck } from "lucide-react"
import { UserDropdown } from "@/components/user-dropdown"
import Link from "next/link"
import { getServerSession } from "@/lib/get-session"
import { unauthorized } from "next/navigation"
import NewsDrawer from "@/components/business/news-drawer"
// import { ModeToggle } from "@/components/mode-toggle"

export async function Navbar() {
  const session = await getServerSession()
  const user = session?.user

  // console.log("Navbar user:", user)

  if (!user) {
    unauthorized()
  }

  return (
    <header className="bg-background border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between bg-gradient-to-b from-blue-500 to-cyan-500 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-white">
          <CalendarCheck size={32} />
          <span className="text-xl font-semibold text-white">CRM APP</span>
        </Link>
        <div className="flex items-center gap-2">
          <NewsDrawer userId={user?.id} />

          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  )
}

// <ModeToggle />
