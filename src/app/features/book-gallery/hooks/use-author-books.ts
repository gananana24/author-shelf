import { useCallback, useEffect, useState } from 'react'
import { useRef } from 'react'

import type { BookPage } from '../../../../api/services/book-catalog'
import type { BookEdition, BookView } from '../../../../shared/book'

type BooksResponse = BookPage | { error: { message: string } }
const loadMoreDelayMs = 1_500

/** 著者ページの書籍一覧を取得・再試行する状態を管理する。 */
export function useAuthorBooks(authorName: string, view: BookView, seed: string) {
  const [books, setBooks] = useState<BookEdition[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const lastLoadMoreAtRef = useRef(0)
  const isLoadingMoreRef = useRef(false)
  const nextCursorRef = useRef<string | null>(null)

  const fetchBooks = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams({ view, seed })
      if (cursor) params.set('cursor', cursor)

      const response = await fetch(
        `/api/authors/${encodeURIComponent(authorName)}/books?${params.toString()}`,
      )
      return (await response.json()) as BooksResponse
    },
    [authorName, seed, view],
  )

  const loadBooks = useCallback(async () => {
    setBooks([])
    setTotal(0)
    setError('')
    setIsLoading(true)
    setNextCursor(null)
    nextCursorRef.current = null

    try {
      const result = await fetchBooks(null)

      if ('error' in result) {
        setError(result.error.message)
        return
      }

      setBooks(result.items)
      setTotal(result.total)
      setNextCursor(result.nextCursor)
      nextCursorRef.current = result.nextCursor
    } catch {
      setError('本の情報を取得できませんでした。時間をおいてもう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }, [fetchBooks])

  const loadMore = async () => {
    const cursor = nextCursorRef.current
    if (!cursor || isLoadingMoreRef.current || isLoading) return

    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    try {
      const elapsed = Date.now() - lastLoadMoreAtRef.current
      const remainingDelay = Math.max(0, loadMoreDelayMs - elapsed)
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay))
      }

      lastLoadMoreAtRef.current = Date.now()
      const result = await fetchBooks(cursor)

      if ('error' in result) {
        setError(result.error.message)
        return
      }

      setBooks((currentBooks) => [...currentBooks, ...result.items])
      setNextCursor(result.nextCursor)
      nextCursorRef.current = result.nextCursor
    } catch {
      setError('続きの本を取得できませんでした。時間をおいてもう一度お試しください。')
    } finally {
      isLoadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  return { books, error, isLoading, isLoadingMore, loadBooks, loadMore, nextCursor, total }
}
