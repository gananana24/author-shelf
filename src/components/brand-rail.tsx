import Image from "next/image"
import Link from "next/link"

export function BrandRail() {
  return (
    <aside className="sticky top-0 z-20 flex items-center border-border border-b bg-background px-5 py-4 md:col-span-1 md:h-svh md:self-start md:flex-col md:border-r md:border-b-0 md:px-0 md:py-7">
      <Link
        href="/"
        className="group/brand flex items-center gap-3 outline-none md:flex-col md:gap-10"
        aria-label="Shoka トップへ"
      >
        <Image
          src="/images/author-shelf-orb.png"
          alt=""
          width={96}
          height={96}
          priority
          className="size-9 object-contain ring-ring ring-offset-4 ring-offset-background transition-shadow group-focus-visible/brand:ring-2 md:size-14"
        />
        <span className="font-serif text-base tracking-widest transition-colors group-focus-visible/brand:text-accent-foreground md:[writing-mode:vertical-rl] md:text-xl">
          Shoka
        </span>
      </Link>
    </aside>
  )
}
