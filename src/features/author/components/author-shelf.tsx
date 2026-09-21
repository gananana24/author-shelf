"use client"

import { Popover } from "@base-ui/react/popover"
import { ChevronDown, ExternalLink, RotateCw, X } from "lucide-react"
import Image from "next/image"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react"
import { hasMultipleAuthors } from "@/features/author/book-authors"
import {
  BOOK_FORMAT_OPTIONS,
  BOOK_FORMAT_VALUES,
  type BookFormat,
  getBookFormat,
} from "@/features/author/book-formats"
import { useAuthorBooks } from "@/features/author/hooks/use-author-books"
import type { AuthorBook } from "@/features/author/types"
import { cn } from "@/lib/utils"

const coverTones = [
  "bg-cover-sand text-foreground",
  "bg-cover-ink text-primary-foreground",
  "bg-cover-moss text-primary-foreground",
  "border bg-cover-paper text-foreground",
  "bg-cover-blue text-primary-foreground",
  "bg-cover-clay text-primary-foreground",
  "bg-cover-gray text-foreground",
]

const AUTHORSHIP_OPTIONS = [
  { value: "single", label: "単著のみ" },
  { value: "all", label: "複数名義を含む" },
] as const

function BookCoverOverlay({ book }: { book: AuthorBook }) {
  return (
    <span className="absolute inset-x-0 bottom-0 flex h-1/3 flex-col justify-end bg-linear-to-t from-black/90 via-black/65 to-transparent px-3 pb-3 text-white md:px-4">
      <span className="line-clamp-2 font-serif text-xs leading-4">{book.title}</span>
      <span className="mt-1 font-mono text-[0.625rem] text-white/80 leading-3 tracking-wide">
        {book.publishedDate ?? "刊行日不明"}
      </span>
    </span>
  )
}

function BookCover({ book, index, author }: { book: AuthorBook; index: number; author: string }) {
  if (book.coverUrl) {
    return (
      <span className="block transition group-hover/book:-translate-y-1 group-focus-visible/book:-translate-y-1 motion-reduce:transition-none">
        <span className="relative block aspect-2/3 w-full overflow-hidden">
          <Image
            src={book.coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 64vw, (max-width: 768px) 36vw, (max-width: 1280px) 20vw, 14vw"
            className="object-contain"
          />
          <BookCoverOverlay book={book} />
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "relative flex aspect-2/3 w-full flex-col items-start overflow-hidden p-3 transition group-hover/book:-translate-y-1 group-focus-visible/book:-translate-y-1 motion-reduce:transition-none md:p-4",
        coverTones[index % coverTones.length],
      )}
    >
      <span className="text-xs tracking-wide">{author}</span>
      <BookCoverOverlay book={book} />
    </span>
  )
}

function ShelfLoading({ author }: { author: string }) {
  return (
    <output className="block" aria-busy="true" aria-label={`${author}の書籍を読み込んでいます`}>
      <div className="mb-12 md:mb-16">
        <div className="flex items-baseline gap-4">
          <h1 className="min-w-0 font-serif text-3xl leading-snug tracking-tight sm:text-4xl md:text-5xl">
            {author}
          </h1>
          <div className="h-3 w-12 shrink-0 animate-pulse bg-muted motion-reduce:animate-none" />
        </div>
      </div>
      <div className="grid w-full max-w-full grid-cols-[4.75rem_minmax(0,1fr)] md:grid-cols-[7.5rem_minmax(0,1fr)]">
        <div className="border-border border-r" />
        <div className="author-books-grid grid w-full max-w-full min-w-0 grid-cols-2 gap-5 pl-5 md:grid-cols-4 md:gap-6 md:pl-8 xl:grid-cols-5 xl:gap-8">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              className="aspect-2/3 w-full animate-pulse bg-muted motion-reduce:animate-none"
              key={item}
            />
          ))}
        </div>
      </div>
    </output>
  )
}

export function AuthorShelf({ author }: { author: string }) {
  const [scope, setScope] = useQueryState(
    "scope",
    parseAsStringLiteral(["all"] as const).withOptions({ history: "push", shallow: true }),
  )
  const [format, setFormat] = useQueryState(
    "format",
    parseAsStringLiteral(BOOK_FORMAT_VALUES).withOptions({ history: "push", shallow: true }),
  )
  const includeMultipleAuthors = scope === "all"
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useAuthorBooks(author)
  const [selectedBook, setSelectedBook] = useState<AuthorBook | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const loadMoreRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  const books = useMemo(() => {
    const loadedBooks = data?.pages.flatMap((page) => page.books) ?? []
    return [
      ...new Map(
        loadedBooks.map((book) => [
          book.isbn ?? `${book.title}-${book.publisher}-${book.sortDate}`,
          book,
        ]),
      ).values(),
    ].sort(
      (a, b) =>
        a.sortDate.localeCompare(b.sortDate) ||
        a.title.localeCompare(b.title, "ja") ||
        (a.isbn ?? "").localeCompare(b.isbn ?? ""),
    )
  }, [data])

  const visibleBooks = useMemo(() => {
    const booksByAuthorship = includeMultipleAuthors
      ? books
      : books.filter((book) => !hasMultipleAuthors(book.authors))

    return format
      ? booksByAuthorship.filter((book) => getBookFormat(book.size) === format)
      : booksByAuthorship
  }, [books, format, includeMultipleAuthors])

  const booksByYear = useMemo(() => {
    const groups = new Map<number | "unknown", AuthorBook[]>()
    for (const book of visibleBooks) {
      const key = book.year ?? "unknown"
      groups.set(key, [...(groups.get(key) ?? []), book])
    }
    return [...groups.entries()]
  }, [visibleBooks])

  useEffect(() => {
    if (selectedBook && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [selectedBook])

  useEffect(() => {
    const loadMoreButton = loadMoreRef.current
    if (!loadMoreButton || !hasNextPage || isFetchNextPageError) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: "25% 0px" },
    )
    observer.observe(loadMoreButton)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage])

  const openBook = (book: AuthorBook, event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget
    setSelectedBook(book)
  }

  const handleDialogClose = () => {
    setSelectedBook(null)
    openerRef.current?.focus()
  }

  const selectedFormatLabel =
    BOOK_FORMAT_OPTIONS.find((option) => option.value === (format ?? ""))?.label ?? "すべて"
  const filterSummary = `${includeMultipleAuthors ? "複数名義を含む" : "単著のみ"}・${format ? selectedFormatLabel : "全判型"}`
  const hasNonDefaultFilter = includeMultipleAuthors || format !== null

  if (isPending) return <ShelfLoading author={author} />

  if (error && !data) {
    return (
      <div
        className="mx-auto flex min-h-96 max-w-md flex-col items-start justify-center"
        role="alert"
      >
        <h1 className="font-serif text-3xl">{author}</h1>
        <p className="mt-6 text-muted-foreground text-sm leading-relaxed">{error.message}</p>
        <button
          type="button"
          className="mt-8 flex items-center gap-2 border-foreground border-b pb-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:text-accent-foreground"
          onClick={() => refetch()}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          再試行
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="mb-12 md:mb-16">
        <div className="flex items-baseline gap-4">
          <h1 className="min-w-0 font-serif text-3xl leading-snug tracking-tight sm:text-4xl md:text-5xl">
            {author}
          </h1>
          <p className="shrink-0 text-muted-foreground text-xs tracking-wider">
            {data?.pages[0]?.total ?? 0}冊
          </p>
        </div>
        <Popover.Root open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <Popover.Trigger className="mt-6 flex items-center gap-3 text-xs outline-none transition-colors hover:text-accent-foreground focus-visible:text-accent-foreground">
            <span className="text-muted-foreground">絞り込み</span>
            <span>{filterSummary}</span>
            <ChevronDown
              className={cn("size-3 transition-transform", isFilterOpen && "rotate-180")}
              aria-hidden="true"
            />
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner
              className="z-50 outline-none"
              side="bottom"
              align="start"
              sideOffset={12}
              collisionPadding={16}
            >
              <Popover.Popup
                className="w-[min(28rem,calc(100vw-2rem))] border border-border bg-background px-5 py-5 text-foreground outline-none transition-[opacity,transform] duration-200 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 motion-reduce:transition-none"
                id="book-filters"
              >
                <Popover.Title className="sr-only">書籍の絞り込み</Popover.Title>
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-4">
                  <p className="pt-1 text-muted-foreground text-xs" id="authorship-filter-label">
                    名義
                  </p>
                  <fieldset
                    className="flex flex-wrap gap-x-6 gap-y-3"
                    aria-labelledby="authorship-filter-label"
                  >
                    <legend className="sr-only">表示する著者名義</legend>
                    {AUTHORSHIP_OPTIONS.map((option) => {
                      const isChecked = option.value === (includeMultipleAuthors ? "all" : "single")
                      return (
                        <label className="cursor-pointer" key={option.value}>
                          <input
                            className="peer sr-only"
                            type="radio"
                            name="authorship"
                            value={option.value}
                            checked={isChecked}
                            onChange={() => void setScope(option.value === "all" ? "all" : null)}
                          />
                          <span
                            className={cn(
                              "block border-b pb-1 text-xs transition-colors peer-focus-visible:border-ring peer-focus-visible:text-accent-foreground",
                              isChecked
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </span>
                        </label>
                      )
                    })}
                  </fieldset>
                </div>

                <div className="mt-5 grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-4 border-border border-t pt-5">
                  <p className="pt-1 text-muted-foreground text-xs" id="format-filter-label">
                    判型
                  </p>
                  <fieldset
                    className="flex flex-wrap gap-x-6 gap-y-3"
                    aria-labelledby="format-filter-label"
                  >
                    <legend className="sr-only">表示する本の判型</legend>
                    {BOOK_FORMAT_OPTIONS.map((option) => {
                      const isChecked = option.value === (format ?? "")
                      return (
                        <label className="cursor-pointer" key={option.value || "all"}>
                          <input
                            className="peer sr-only"
                            type="radio"
                            name="book-format"
                            value={option.value}
                            checked={isChecked}
                            onChange={() =>
                              void setFormat(
                                option.value === "" ? null : (option.value as BookFormat),
                              )
                            }
                          />
                          <span
                            className={cn(
                              "block border-b pb-1 text-xs transition-colors peer-focus-visible:border-ring peer-focus-visible:text-accent-foreground",
                              isChecked
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option.label}
                          </span>
                        </label>
                      )
                    })}
                  </fieldset>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    className="border-transparent border-b pb-1 text-muted-foreground text-xs outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:border-ring focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-30"
                    disabled={!hasNonDefaultFilter}
                    onClick={() => {
                      void setScope(null)
                      void setFormat(null)
                    }}
                  >
                    リセット
                  </button>
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </header>

      {visibleBooks.length === 0 ? (
        <p className="border-border border-t py-12 text-muted-foreground text-sm">
          {hasNextPage
            ? "条件に一致する本を引き続き探しています。"
            : "該当する紙の本が見つかりませんでした。"}
        </p>
      ) : (
        <div>
          {booksByYear.map(([year, books], groupIndex) => (
            <section
              className="grid w-full max-w-full grid-cols-[4.75rem_minmax(0,1fr)] md:grid-cols-[7.5rem_minmax(0,1fr)]"
              key={year}
              aria-labelledby={`year-${year}`}
            >
              <div
                className={cn(
                  "relative min-w-0 border-border border-r pr-4 pb-16 md:pr-6 md:pb-24",
                  groupIndex === booksByYear.length - 1 && "border-transparent pb-0 md:pb-0",
                )}
              >
                <span
                  className="absolute -right-1.5 top-2.5 size-3 rounded-full bg-accent-foreground ring-4 ring-background"
                  aria-hidden="true"
                />
                <h2
                  className="sticky top-6 text-left font-serif text-2xl text-muted-foreground tracking-tight md:text-3xl lg:text-4xl"
                  id={`year-${year}`}
                >
                  {year === "unknown" ? "不明" : year}
                </h2>
              </div>
              <div
                className={cn(
                  "author-books-grid grid w-full max-w-full min-w-0 grid-cols-2 items-start gap-5 pb-16 pl-5 md:grid-cols-4 md:gap-6 md:pb-24 md:pl-8 xl:grid-cols-5 xl:gap-8",
                  groupIndex === booksByYear.length - 1 && "pb-0 md:pb-0",
                )}
              >
                {books.map((book, bookIndex) => (
                  <button
                    className="group/book block min-w-0 w-full bg-transparent p-0 text-left outline-none ring-offset-4 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                    key={book.id}
                    aria-label={`${book.title}、${book.publishedDate ?? "刊行日不明"}`}
                    onClick={(event) => openBook(book, event)}
                  >
                    <BookCover book={book} index={bookIndex + groupIndex} author={author} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-16 flex justify-center" aria-live="polite">
          <button
            ref={loadMoreRef}
            type="button"
            className="border-foreground border-b pb-1 text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:border-ring focus-visible:text-accent-foreground disabled:cursor-wait disabled:opacity-60"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage
              ? "読み込み中"
              : isFetchNextPageError
                ? "取得できませんでした。再試行"
                : "続きを読み込む"}
          </button>
        </div>
      )}

      <p className="mt-20 border-border border-t pt-5 text-muted-foreground text-xs leading-relaxed">
        書誌情報・書影・内容紹介は楽天Books APIを利用しています。
      </p>

      <dialog
        ref={dialogRef}
        className="m-auto w-11/12 max-w-4xl border-0 bg-background p-0 text-foreground backdrop:bg-foreground/50"
        aria-labelledby="book-dialog-title"
        onClose={handleDialogClose}
      >
        {selectedBook && (
          <div className="relative grid min-h-96 gap-x-8 gap-y-7 p-6 pt-14 sm:grid-cols-5 sm:p-12">
            <button
              className="absolute top-5 right-5 z-10 grid size-10 place-items-center rounded-full bg-background/90 outline-none transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground"
              type="button"
              aria-label="詳細を閉じる"
              onClick={() => dialogRef.current?.close()}
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <div className="order-2 w-[52vw] max-w-48 sm:order-1 sm:col-span-2 sm:row-span-2 sm:w-full sm:max-w-none">
              {selectedBook.coverUrl ? (
                <div className="relative aspect-2/3 w-full">
                  <Image
                    src={selectedBook.coverUrl}
                    alt={`${selectedBook.title}の書影`}
                    fill
                    sizes="(max-width: 640px) 80vw, 32vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex aspect-2/3 w-full items-start bg-cover-paper p-8 font-serif text-2xl">
                  {selectedBook.title}
                </div>
              )}
            </div>

            <div className="order-1 pr-8 sm:order-2 sm:col-span-3 sm:pr-0">
              <p className="font-mono text-muted-foreground text-xs tracking-wider">
                {selectedBook.publishedDate ?? "刊行年不明"}
              </p>
              <h2 className="mt-4 font-serif text-3xl tracking-tight" id="book-dialog-title">
                {selectedBook.title}
              </h2>
            </div>

            <div className="order-3 flex flex-col sm:col-span-3">
              <dl className="mt-10 border-border border-t pt-5 text-sm">
                <div className="grid grid-cols-3 gap-4 py-2">
                  <dt className="text-muted-foreground">著者</dt>
                  <dd className="col-span-2">{selectedBook.authors.join("、")}</dd>
                </div>
                {selectedBook.publisher && (
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <dt className="text-muted-foreground">出版社</dt>
                    <dd className="col-span-2">{selectedBook.publisher}</dd>
                  </div>
                )}
                {selectedBook.size && (
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <dt className="text-muted-foreground">判型</dt>
                    <dd className="col-span-2">{selectedBook.size}</dd>
                  </div>
                )}
                {selectedBook.isbn && (
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <dt className="text-muted-foreground">ISBN</dt>
                    <dd className="col-span-2 font-mono">{selectedBook.isbn}</dd>
                  </div>
                )}
              </dl>
              {selectedBook.description && (
                <p className="mt-8 text-muted-foreground text-sm leading-7">
                  {selectedBook.description}
                </p>
              )}
              <a
                href={selectedBook.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-auto flex w-fit items-center gap-2 border-foreground border-b pt-10 pb-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:text-accent-foreground"
              >
                出典を確認
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
