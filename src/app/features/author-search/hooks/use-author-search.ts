import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { apiClient } from '@/lib/api-client'

const normalizeAuthorQuery = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s/g, '').toLocaleLowerCase('ja-JP')
const createSeed = () => crypto.randomUUID()

/** 著者候補の検索状態と著者ページへの遷移を管理する。 */
export function useAuthorSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchAuthors = async (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    requestRef.current?.abort()

    if (!searchQuery.trim()) {
      setAuthors([])
      setError('')
      setHasSearched(false)
      return
    }

    const controller = new AbortController()
    requestRef.current = controller
    setError('')
    setAuthors([])
    setHasSearched(true)
    setIsSearching(true)

    try {
      const response = await apiClient.api.authors.$get(
        { query: { q: searchQuery } },
        { init: { signal: controller.signal } },
      )
      const result = await response.json()

      if ('error' in result) {
        setError(result.error.message)
        return
      }

      const authorNames = result.authors.map(({ name }) => name)
      const exactAuthor = authorNames.find(
        (name) => normalizeAuthorQuery(name) === normalizeAuthorQuery(searchQuery),
      )

      if (authorNames.length === 1 && exactAuthor) {
        selectAuthor(exactAuthor)
        return
      }

      setAuthors(authorNames)
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === 'AbortError') return
      setError('検索に失敗しました。時間をおいてもう一度お試しください。')
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setIsSearching(false)
      }
    }
  }

  const selectAuthor = (authorName: string) => {
    setAuthors([])
    setHasSearched(false)
    void navigate({
      to: '/authors/$authorName',
      params: { authorName },
      search: { seed: createSeed(), view: 'random' },
    })
  }

  const clearAuthors = () => {
    setAuthors([])
    setHasSearched(false)
  }

  const updateQuery = (value: string, shouldSearch = true) => {
    setQuery(value)
    setHasSearched(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!shouldSearch || !value.trim()) {
      setAuthors([])
      setError('')
      return
    }

    debounceRef.current = setTimeout(() => {
      void searchAuthors(value)
    }, 500)
  }

  return {
    authors,
    clearAuthors,
    error,
    hasSearched,
    isSearching,
    query,
    searchAuthors,
    selectAuthor,
    setQuery: updateQuery,
  }
}
