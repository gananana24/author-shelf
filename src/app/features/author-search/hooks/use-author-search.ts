import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { apiClient } from '@/lib/api-client'

/** 著者候補の検索状態と著者ページへの遷移を管理する。 */
export function useAuthorSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const searchAuthors = async (searchQuery: string) => {
    setError('')
    setAuthors([])
    setIsSearching(true)

    try {
      const response = await apiClient.api.authors.$get({ query: { q: searchQuery } })
      const result = await response.json()

      if ('error' in result) {
        setError(result.error.message)
        return
      }

      setAuthors(result.authors.map(({ name }) => name))
    } catch {
      setError('検索に失敗しました。時間をおいてもう一度お試しください。')
    } finally {
      setIsSearching(false)
    }
  }

  const selectAuthor = (authorName: string) => {
    setAuthors([])
    void navigate({
      to: '/authors/$authorName',
      params: { authorName },
    })
  }

  const clearAuthors = () => setAuthors([])

  return {
    authors,
    clearAuthors,
    error,
    isSearching,
    query,
    searchAuthors,
    selectAuthor,
    setQuery,
  }
}
