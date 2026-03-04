import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { NotificationProvider } from "@/context/notification-context"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CRM MVP APP",
  description: "Tasks management MVP",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>{children}</NotificationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
