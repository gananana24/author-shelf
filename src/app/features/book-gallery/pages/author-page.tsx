import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

import BookGrid from '../components/book-grid'
import { useAuthorBooks } from '../hooks/use-author-books'

/** 選択した著者の刊行物ページを表示する。 */
const AuthorPage = () => {
  const { authorName } = useParams({ from: '/authors/$authorName' })
  const { seed, view } = useSearch({ from: '/authors/$authorName' })
  const navigate = useNavigate()
  const { books, error, isLoading, isLoadingMore, loadBooks, loadMore, nextCursor, total } =
    useAuthorBooks(authorName, view, seed ?? 'preview')
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setLoadMoreTarget = (node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!node || !nextCursor) return

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void loadMore()
    })
    observerRef.current.observe(node)
  }

  const changeView = (nextView: 'random' | 'year') => {
    if (nextView === view) return
    void navigate({
      to: '/authors/$authorName',
      params: { authorName },
      search: { seed, view: nextView },
    })
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 pb-12 pt-3 sm:px-8 sm:pt-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{authorName}</h1>
          {!isLoading && !error && <p className="text-xs text-muted-foreground">{total}</p>}
        </div>
        <div aria-label="表示順" className="flex rounded-full bg-muted/60 p-1" role="group">
          {(
            [
              ['random', 'ランダム'],
              ['year', '刊行年順'],
            ] as const
          ).map(([value, label]) => (
            <Button
              aria-pressed={view === value}
              className={`h-7 rounded-full px-3 text-xs ${view === value ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'}`}
              key={value}
              onClick={() => changeView(value)}
              type="button"
              variant={view === value ? 'secondary' : 'ghost'}
            >
              {label}
            </Button>
          ))}
        </div>
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
        <>
          {books.length === 0 && !isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground" role="status">
              この著者の本は見つかりませんでした。
            </p>
          ) : (
            <BookGrid
              books={books}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              view={view}
            />
          )}
          {nextCursor && <div aria-hidden="true" className="h-8" ref={setLoadMoreTarget} />}
        </>
      )}
    </main>
  )
}

export default AuthorPage
