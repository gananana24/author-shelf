import Image from "next/image"
import AuthorSearchForm from "@/features/author/components/author-search-form"

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <section className="relative w-full max-w-lg">
        <div className="absolute bottom-full mb-6 w-full text-center">
          <Image
            src="/images/author-shelf-orb.png"
            alt="緑のグラデーションの円"
            width={160}
            height={160}
            loading="eager"
            className="mx-auto mb-2 size-24 object-contain"
          />
          <h1 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Shoka
          </h1>
        </div>
        <AuthorSearchForm />
      </section>
    </main>
  )
}
