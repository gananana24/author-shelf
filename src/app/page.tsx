import { Suspense } from "react"
import { BrandRail } from "@/components/brand-rail"
import AuthorSearchForm from "@/features/author/components/author-search-form"

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col md:grid md:grid-cols-12">
      <BrandRail />
      <section
        className="flex flex-1 items-start px-5 pt-14 sm:pt-20 md:col-span-11 md:px-12 md:pt-24 lg:px-20 lg:pt-28"
        aria-label="著者検索"
      >
        <div className="w-full">
          <header className="grid grid-cols-12">
            <div className="col-span-11 col-start-2 min-w-0 md:col-span-10">
              <h1 className="max-w-3xl font-serif text-3xl leading-snug tracking-tight sm:text-4xl md:text-5xl">
                <span className="block sm:inline">著者から、</span>
                <span>刊行の軌跡をたどる。</span>
              </h1>
              <p className="mt-5 max-w-sm text-muted-foreground text-xs leading-6">
                名前を手がかりに、紙の本を刊行年の順に眺めます。
              </p>
            </div>
          </header>

          <div className="mt-14 grid grid-cols-12">
            <div className="col-span-11 col-start-2 min-w-0 md:col-span-8 lg:col-span-7">
              <Suspense fallback={<div className="h-28" aria-hidden="true" />}>
                <AuthorSearchForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
