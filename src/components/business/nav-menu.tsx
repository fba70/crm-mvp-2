"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMenu() {
  const pathname = usePathname()
  return (
    <footer className="flex flex-row items-center justify-center gap-5">
      <div className="flex items-center justify-between py-3">
        <Link
          href="/dashboard"
          className={
            pathname.startsWith("/dashboard")
              ? "font-bold text-yellow-300"
              : "font-normal text-white"
          }
        >
          DASHBOARD
        </Link>
      </div>

      <div className="flex items-center justify-between py-3">
        <Link
          href="/feed"
          className={
            pathname.startsWith("/feed")
              ? "font-bold text-yellow-300"
              : "font-normal text-white"
          }
        >
          FEED
        </Link>
      </div>

      <div className="flex items-center justify-between py-3">
        <Link
          href="/tasks"
          className={
            pathname.startsWith("/tasks")
              ? "font-bold text-yellow-300"
              : "font-normal text-white"
          }
        >
          TASKS
        </Link>
      </div>

      <div className="flex items-center justify-between py-3">
        <Link
          href="/clients"
          className={
            pathname.startsWith("/clients")
              ? "font-bold text-yellow-300"
              : "font-normal text-white"
          }
        >
          CLIENTS
        </Link>
      </div>

      <div className="flex items-center justify-between py-3">
        <Link
          href="/sources"
          className={
            pathname.startsWith("/sources")
              ? "font-bold text-yellow-300"
              : "font-normal text-white"
          }
        >
          SOURCES
        </Link>
      </div>
    </footer>
  )
}
