import { useCallback, useEffect, useState } from 'react'

import { apiClient } from '@/lib/api-client'

import type { BookEdition } from '../../../../shared/book'

/** 著者ページの書籍一覧を取得・再試行する状態を管理する。 */
export function useAuthorBooks(authorName: string) {
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
      const response = await apiClient.api.authors[':authorName'].books.$get({
        param: { authorName },
      })
      const result = await response.json()

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
  }, [authorName])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  return { books, error, isLoading, loadBooks, total }
}
