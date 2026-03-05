import { UserDropdown } from "@/components/user-dropdown"
import Link from "next/link"
import { getServerSession } from "@/lib/get-session"
import { unauthorized } from "next/navigation"
import NewsDrawer from "@/components/business/news-drawer"
import Image from "next/image"
// import { ModeToggle } from "@/components/mode-toggle"

export async function Navbar() {
  const session = await getServerSession()
  const user = session?.user

  // console.log("Navbar user:", user)

  if (!user) {
    unauthorized()
  }

  return (
    <header className="border-b bg-gradient-to-b from-blue-500 to-fuchsia-500">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-4 text-white">
          <Image
            src="/T_logo_2.jpg"
            alt="TRUFFALO.AI Logo"
            width={36}
            height={36}
            className="rounded-full border-2 border-blue-300"
          />
          <span className="text-2xl font-semibold text-white">TRUFFALO.AI</span>
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
