"use client"

import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import { useAuthorSuggestions } from "@/features/author/hooks/use-author-suggestions"
import { useDebouncedValue } from "@/features/author/hooks/use-debounced-value"
import type { AuthorSuggestion } from "@/features/author/types"

const LISTBOX_ID = "author-suggestions"

const suggestionId = (index: number) => `${LISTBOX_ID}-${index}`

const AuthorSearchForm = () => {
  const router = useRouter()
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ history: "replace", shallow: true }),
  )
  const debouncedQuery = useDebouncedValue(query.trim(), 350)
  const { data: suggestions = [], error, isFetching } = useAuthorSuggestions(debouncedQuery)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const hasSettledQuery = debouncedQuery === query.trim()
  const visibleSuggestions = hasSettledQuery ? suggestions : []
  const safeActiveIndex = Math.min(activeIndex, Math.max(visibleSuggestions.length - 1, 0))
  const activeSuggestion = visibleSuggestions[safeActiveIndex]

  const openSuggestion = (suggestion: AuthorSuggestion | undefined) => {
    if (!suggestion) return
    setIsOpen(false)
    router.push(`/authors/${encodeURIComponent(suggestion.name)}`)
  }

  return (
    <search>
      <form
        id="author-search-form"
        onSubmit={(event) => {
          event.preventDefault()
          openSuggestion(activeSuggestion)
        }}
      >
        <div className="group/search">
          <div className="flex border-foreground/70 border-b-2 transition-colors focus-within:border-ring">
            <input
              id="author-query"
              className="h-16 min-w-0 flex-1 bg-transparent p-0 font-serif text-xl outline-none placeholder:text-muted-foreground/60 sm:text-2xl"
              value={query}
              onChange={(event) => {
                void setQuery(event.target.value)
                setActiveIndex(0)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return

                if (event.key === "ArrowDown" && visibleSuggestions.length > 0) {
                  event.preventDefault()
                  setIsOpen(true)
                  setActiveIndex((current) => (current + 1) % visibleSuggestions.length)
                }

                if (event.key === "ArrowUp" && visibleSuggestions.length > 0) {
                  event.preventDefault()
                  setIsOpen(true)
                  setActiveIndex(
                    (current) =>
                      (current - 1 + visibleSuggestions.length) % visibleSuggestions.length,
                  )
                }

                if (event.key === "Escape") {
                  event.preventDefault()
                  setIsOpen(false)
                }
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-controls={LISTBOX_ID}
              aria-expanded={isOpen && visibleSuggestions.length > 0}
              aria-activedescendant={
                isOpen && activeSuggestion ? suggestionId(safeActiveIndex) : undefined
              }
              aria-describedby="author-search-status"
              autoComplete="off"
              enterKeyHint="go"
              placeholder="東野圭吾"
            />
            <button
              className="flex items-center justify-end gap-3 bg-transparent px-2 pl-5 font-mono text-xs uppercase tracking-wider outline-none transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-default disabled:opacity-30"
              type="submit"
              aria-label="選択中の著者を開く"
              disabled={!activeSuggestion}
            >
              <ArrowUpRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          {isOpen && visibleSuggestions.length > 0 && (
            <div className="mt-5" id={LISTBOX_ID} role="listbox" aria-label="著者候補">
              {visibleSuggestions.map((suggestion, index) => {
                const isActive = index === safeActiveIndex
                return (
                  <Link
                    href={`/authors/${encodeURIComponent(suggestion.name)}`}
                    id={suggestionId(index)}
                    role="option"
                    aria-selected={isActive}
                    key={suggestion.name}
                    className={`block border-l-2 px-4 py-3 font-serif text-lg outline-none transition-colors ${
                      isActive
                        ? "border-accent-foreground bg-accent text-accent-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setIsOpen(false)}
                  >
                    {suggestion.name}
                  </Link>
                )
              })}
            </div>
          )}

          <p
            className="mt-4 min-h-5 text-muted-foreground text-xs"
            id="author-search-status"
            aria-live="polite"
          >
            {query.trim().length > 0 && query.trim().length < 2
              ? "2文字以上入力してください"
              : query.trim().length >= 2 && (!hasSettledQuery || isFetching)
                ? "検索中"
                : hasSettledQuery && error
                  ? error.message
                  : isOpen && debouncedQuery.length >= 2 && visibleSuggestions.length === 0
                    ? "該当する著者が見つかりません"
                    : ""}
          </p>
        </div>
      </form>
    </search>
  )
}

export default AuthorSearchForm
