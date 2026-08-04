import { useLocation } from '@tanstack/react-router'
import { LoaderCircle, Search } from 'lucide-react'
import { type KeyboardEvent, type SyntheticEvent, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useAuthorSearch } from '../hooks/use-author-search'

const suggestedAuthors = ['青空', '夏目漱石', '宮沢賢治']

/** 著者名を検索し、候補を著者ページへのリンクとして表示する。 */
const AuthorSearch = () => {
  const { pathname } = useLocation()
  const {
    authors,
    clearAuthors,
    error,
    hasSearched,
    isSearching,
    query,
    searchAuthors,
    selectAuthor,
    setQuery,
  } = useAuthorSearch()
  const isInitialState = pathname === '/'
  const [activeAuthorIndex, setActiveAuthorIndex] = useState(-1)
  const isComposingRef = useRef(false)

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!query.trim()) return
    setActiveAuthorIndex(-1)
    void searchAuthors(query)
  }

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (authors.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveAuthorIndex((index) => (index + 1) % authors.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveAuthorIndex((index) => (index <= 0 ? authors.length - 1 : index - 1))
        break
      case 'Enter':
        if (activeAuthorIndex >= 0) {
          event.preventDefault()
          selectAuthor(authors[activeAuthorIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        setActiveAuthorIndex(-1)
        clearAuthors()
        break
      default:
        break
    }
  }

  return (
    <section
      aria-label="著者検索"
      className={
        isInitialState
          ? 'flex min-h-[calc(100svh-1rem)] items-center bg-[radial-gradient(circle_at_50%_44%,rgb(134_239_172_/_0.13),transparent_72%)]'
          : undefined
      }
    >
      <div
        className={`relative mx-auto flex w-full max-w-375 justify-center px-4 sm:px-8 ${isInitialState ? 'pb-8' : 'pb-2 pt-6 sm:pt-8'}`}
      >
        <form className="relative w-full max-w-2xl" onSubmit={handleSubmit}>
          <Field className="relative gap-1.5" data-invalid={Boolean(error)}>
            <FieldLabel className="sr-only" htmlFor="author-query">
              著者名
            </FieldLabel>
            <div className="flex items-center rounded-full bg-background/80 px-2 ring ring-foreground/25 backdrop-blur-sm transition-colors focus-within:ring-emerald-600/65">
              <Search aria-hidden="true" className="ml-2 size-4 text-muted-foreground" />
              <Input
                aria-invalid={Boolean(error)}
                aria-controls="author-search-results"
                aria-describedby={error ? 'author-search-error' : undefined}
                aria-expanded={authors.length > 0}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-activedescendant={
                  activeAuthorIndex >= 0 ? `author-result-${activeAuthorIndex}` : undefined
                }
                aria-busy={isSearching}
                autoComplete="off"
                className="h-11 border-0 bg-transparent px-3 shadow-none outline-none focus-visible:ring-0"
                id="author-query"
                onCompositionEnd={(event) => {
                  isComposingRef.current = false
                  setQuery(event.currentTarget.value)
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onChange={(event) => {
                  setActiveAuthorIndex(-1)
                  setQuery(event.target.value, !isComposingRef.current)
                }}
                onKeyDown={handleQueryKeyDown}
                placeholder="著者名で検索（例: 青空）"
                role="combobox"
                type="search"
                value={query}
              />
              <Button
                aria-label={isSearching ? '検索中' : '検索'}
                className="size-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
                disabled={isSearching}
                size="icon"
                type="submit"
              >
                {isSearching ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Search aria-hidden="true" />
                )}
              </Button>
            </div>
            {error && <FieldError id="author-search-error">{error}</FieldError>}
            {authors.length > 0 && (
              <div
                className="absolute top-full left-0 z-20 mt-1 w-full rounded-xl bg-background p-1.5 shadow-lg ring ring-black/5"
                id="author-search-results"
                role="listbox"
              >
                {authors.map((author, index) => (
                  <Button
                    aria-selected={index === activeAuthorIndex}
                    className={`h-auto w-full justify-start px-2 py-2.5 text-left ${index === activeAuthorIndex ? 'bg-muted text-foreground' : ''}`}
                    id={`author-result-${index}`}
                    key={author}
                    onClick={() => selectAuthor(author)}
                    onMouseEnter={() => setActiveAuthorIndex(index)}
                    role="option"
                    type="button"
                    variant="ghost"
                  >
                    {author}
                  </Button>
                ))}
              </div>
            )}
            {hasSearched && !isSearching && !error && authors.length === 0 && query.trim() && (
              <p className="absolute top-full left-0 z-20 mt-1 w-full rounded-xl bg-background p-4 text-sm text-muted-foreground shadow-lg ring ring-black/5">
                著者が見つかりませんでした。
              </p>
            )}
          </Field>

          {isInitialState && (
            <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="検索例">
              {suggestedAuthors.map((author) => (
                <Button
                  className="rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                  key={author}
                  onClick={() => setQuery(author)}
                  type="button"
                  variant="ghost"
                >
                  {author}
                </Button>
              ))}
            </div>
          )}
        </form>
      </div>
    </section>
  )
}

export default AuthorSearch
