import { Navbar } from "./navbar"
import { Footer } from "./footer"

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen grid-rows-[60px_1fr_50px] flex-col">
      <section className="row-start-1">
        {" "}
        <Navbar />
      </section>
      <section className="row-start-2">{children}</section>
      <section className="row-start-3">
        {" "}
        <Footer />
      </section>
    </div>
  )
}
