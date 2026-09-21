import { BrandRail } from "@/components/brand-rail"
import { AuthorShelf } from "@/features/author/components/author-shelf"

export default async function AuthorPage({ params }: PageProps<"/authors/[author]">) {
  const { author } = await params
  const decodedAuthor = decodeURIComponent(author)

  return (
    <main className="flex min-h-svh flex-col md:grid md:grid-cols-12">
      <BrandRail />

      <div className="min-w-0 flex-1 px-5 pt-14 pb-12 sm:pt-20 md:col-span-11 md:px-12 md:pt-24 md:pb-16 lg:px-20 lg:pt-28 lg:pb-20">
        <section className="min-w-0">
          <AuthorShelf author={decodedAuthor} />
        </section>
      </div>
    </main>
  )
}
