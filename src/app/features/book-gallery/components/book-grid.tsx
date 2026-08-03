import { Skeleton } from '@/components/ui/skeleton'

import type { BookEdition } from '../../../../shared/book'

type BookGridProps = {
  books: BookEdition[]
  isLoading: boolean
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
const BookGrid = ({ books, isLoading }: BookGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton className="aspect-2/3 w-full rounded-md" key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book, index) => (
        <article className="min-w-0" key={book.id}>
          <h2 className="sr-only">{book.title}</h2>
          {book.coverUrl ? (
            <img alt="" className="aspect-2/3 w-full rounded-md object-cover" src={book.coverUrl} />
          ) : (
            <div
              className={`flex aspect-2/3 items-center justify-center rounded-md p-4 text-center text-sm font-semibold leading-5 ${placeholderStyles[index % placeholderStyles.length]}`}
            >
              {book.title}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

export default BookGrid
