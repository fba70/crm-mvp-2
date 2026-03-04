"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House } from "lucide-react"

export function Footer() {
  const pathname = usePathname()
  return (
    <footer className="flex h-[50px] flex-row items-center justify-center gap-5 border-t bg-gray-600 text-white">
      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="/dashboard"
          className={
            pathname.startsWith("/dashboard")
              ? "font-bold text-blue-400"
              : "font-normal"
          }
        >
          <House />
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="/feed"
          className={
            pathname.startsWith("/feed")
              ? "font-bold text-blue-400"
              : "font-normal"
          }
        >
          FEED
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="/tasks"
          className={
            pathname.startsWith("/tasks")
              ? "font-bold text-blue-400"
              : "font-normal"
          }
        >
          AUFGABEN
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="/clients"
          className={
            pathname.startsWith("/clients")
              ? "font-bold text-blue-400"
              : "font-normal"
          }
        >
          KUNDEN
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="/transitions"
          className={
            pathname === "/transitions"
              ? "font-bold text-blue-400"
              : "font-normal"
          }
        >
          ÜBERGABE
        </Link>
      </div>
    </footer>
  )
}
