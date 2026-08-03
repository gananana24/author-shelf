import { useCallback, useEffect, useState } from 'react'

import type { BookPage } from '../../../../api/services/book-catalog'
import type { BookEdition, BookView } from '../../../../shared/book'

type BooksResponse = BookPage | { error: { message: string } }

/** 著者ページの書籍一覧を取得・再試行する状態を管理する。 */
export function useAuthorBooks(authorName: string, view: BookView) {
  const [books, setBooks] = useState<BookEdition[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadBooks = useCallback(async () => {
    setBooks([])
    setTotal(0)
    setError('')
    setIsLoading(true)

    try {
      const params = new URLSearchParams({ view, seed: 'preview' })
      const response = await fetch(
        `/api/authors/${encodeURIComponent(authorName)}/books?${params.toString()}`,
      )
      const result = (await response.json()) as BooksResponse

      if ('error' in result) {
        setError(result.error.message)
        return
      }

      setBooks(result.items)
      setTotal(result.total)
    } catch {
      setError('本の情報を取得できませんでした。時間をおいてもう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }, [authorName, view])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  return { books, error, isLoading, loadBooks, total }
}
