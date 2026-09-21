"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchAuthorBooks } from "@/features/author/api/fetch-author-books"

export const useAuthorBooks = (author: string) =>
  useInfiniteQuery({
    queryKey: ["author-books", 4, author],
    queryFn: ({ pageParam, signal }) => fetchAuthorBooks(author, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
