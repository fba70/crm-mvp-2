import Link from "next/link"

export function Footer() {
  return (
    <footer className="flex h-[50px] flex-row items-center justify-center gap-5 border-t bg-gray-600 text-white">
      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="https://www.truffalo.ai"
          className="font-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          COMPANY
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="https://www.truffalo.ai"
          className="font-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          IMPRESSUM
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="https://www.truffalo.ai"
          className="font-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          PRIVACY POLICY
        </Link>
      </div>

      <div className="flex max-w-6xl items-center justify-between py-3">
        <Link
          href="https://www.truffalo.ai"
          className="font-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          EULA
        </Link>
      </div>
    </footer>
  )
}
