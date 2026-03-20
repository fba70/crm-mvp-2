import { Navbar } from "./navbar"
import { Footer } from "./footer"

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid h-screen grid-rows-[65px_1fr_50px] flex-col">
      <section className="row-start-1">
        {" "}
        <Navbar />
      </section>
      <section className="row-start-2 overflow-y-auto">{children}</section>
      <section className="row-start-3">
        {" "}
        <Footer />
      </section>
    </div>
  )
}
