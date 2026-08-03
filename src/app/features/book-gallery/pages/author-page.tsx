import { useParams } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

import BookGrid from '../components/book-grid'
import { useAuthorBooks } from '../hooks/use-author-books'

/** 選択した著者の刊行物ページを表示する。 */
const AuthorPage = () => {
  const { authorName } = useParams({ from: '/authors/$authorName' })
  const { books, error, isLoading, loadBooks, total } = useAuthorBooks(authorName)

  return (
    <main className="mx-auto max-w-[1500px] px-4 pb-12 pt-3 sm:px-8 sm:pt-5">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{authorName}</h1>
        {!isLoading && !error && <p className="text-xs text-muted-foreground">{total}</p>}
      </div>

      {error ? (
        <div>
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button className="mt-4" onClick={loadBooks} type="button" variant="outline">
            もう一度試す
          </Button>
        </div>
      ) : (
        <BookGrid books={books} isLoading={isLoading} />
      )}
    </main>
  )
}

export default AuthorPage
