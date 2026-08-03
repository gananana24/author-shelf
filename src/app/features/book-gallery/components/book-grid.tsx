import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import type { BookEdition, BookView } from '../../../../shared/book'

type BookGridProps = {
  books: BookEdition[]
  isLoading: boolean
  isLoadingMore?: boolean
  view: BookView
}

const placeholderStyles = [
  'bg-[#e8c36a] text-[#3f321d]',
  'bg-[#d7e4e1] text-[#29423e]',
  'bg-[#db8c79] text-[#4d211b]',
  'bg-[#c8c1d8] text-[#342d45]',
  'bg-[#8fa9c8] text-[#1e3048]',
  'bg-[#e4d8bd] text-[#4a4031]',
]

/** 書影の有無に応じて刊行物を等幅グリッドへ配置する。 */
const BookGrid = ({ books, isLoading, isLoadingMore = false, view }: BookGridProps) => {
  const [selectedBook, setSelectedBook] = useState<BookEdition | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton className="aspect-2/3 w-full rounded-md" key={index} />
        ))}
      </div>
    )
  }

  const sections =
    view === 'year'
      ? Object.entries(
          books.reduce<Record<string, BookEdition[]>>((groups, book) => {
            const year = book.publicationDate.year?.toString() ?? '刊行年不明'
            ;(groups[year] ??= []).push(book)
            return groups
          }, {}),
        )
      : [[null, books] as const]

  return (
    <div className="space-y-12">
      {sections.map(([year, sectionBooks]) => (
        <section
          aria-labelledby={year ? `books-year-${year}` : undefined}
          key={year ?? 'all-books'}
        >
          {year && (
            <h2
              className="mb-5 flex items-center gap-4 text-2xl font-semibold tracking-tight text-foreground"
              id={`books-year-${year}`}
            >
              <span>{year}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-border/70" />
            </h2>
          )}
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sectionBooks.map((book, index) => (
              <article className="min-w-0" key={book.id}>
                <button
                  aria-label={`${book.title}の詳細を開く`}
                  className="group block w-full cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2"
                  onClick={() => setSelectedBook(book)}
                  type="button"
                >
                  <h3 className="sr-only">{book.title}</h3>
                  {book.coverUrl ? (
                    <img
                      alt=""
                      className="aspect-2/3 w-full rounded-md object-cover transition-transform group-hover:scale-[1.02]"
                      src={book.coverUrl}
                    />
                  ) : (
                    <div
                      className={`flex aspect-2/3 items-center justify-center rounded-md p-4 text-center text-sm font-semibold leading-5 transition-transform group-hover:scale-[1.02] ${placeholderStyles[index % placeholderStyles.length]}`}
                    >
                      {book.title}
                    </div>
                  )}
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}

      {isLoadingMore && (
        <div
          aria-label="追加の本を読み込み中"
          className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          role="status"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="aspect-2/3 w-full rounded-md" key={index} />
          ))}
        </div>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedBook(null)
        }}
        open={selectedBook !== null}
      >
        <DialogContent className="max-w-lg">
          {selectedBook && (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle>{selectedBook.title}</DialogTitle>
                <DialogDescription>{selectedBook.authors.join('・')}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 text-sm">
                {selectedBook.description && (
                  <p className="leading-6 text-muted-foreground">{selectedBook.description}</p>
                )}
                <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
                  <dt className="text-muted-foreground">刊行日</dt>
                  <dd>{selectedBook.publicationDate.raw ?? '不明'}</dd>
                  {selectedBook.publisher && (
                    <>
                      <dt className="text-muted-foreground">出版社</dt>
                      <dd>{selectedBook.publisher}</dd>
                    </>
                  )}
                  {selectedBook.format && (
                    <>
                      <dt className="text-muted-foreground">判型</dt>
                      <dd>{selectedBook.format}</dd>
                    </>
                  )}
                  {selectedBook.isbn && (
                    <>
                      <dt className="text-muted-foreground">ISBN</dt>
                      <dd>{selectedBook.isbn}</dd>
                    </>
                  )}
                </dl>
                {selectedBook.sourceUrl && (
                  <a
                    className="text-sm text-emerald-700 underline-offset-4 hover:underline"
                    href={selectedBook.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    書誌情報の出典を開く
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookGrid
