import type { AuthorSuggestion } from "@/features/author/types"

type AuthorSuggestionsResponse = {
  suggestions: AuthorSuggestion[]
}

export const fetchAuthorSuggestions = async (query: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ q: query, v: "3" })
  const response = await fetch(`/api/authors/suggestions?${params}`, {
    ...(signal ? { signal } : {}),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "著者候補を取得できませんでした")
  }

  return ((await response.json()) as AuthorSuggestionsResponse).suggestions
}
