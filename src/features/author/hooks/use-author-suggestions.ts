"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchAuthorSuggestions } from "@/features/author/api/fetch-author-suggestions"

export const useAuthorSuggestions = (query: string) =>
  useQuery({
    queryKey: ["author-suggestions", 3, query],
    queryFn: ({ signal }) => fetchAuthorSuggestions(query, signal),
    enabled: query.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
