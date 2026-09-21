import type { AuthorBooksResponse } from "@/features/author/types"

export const fetchAuthorBooks = async (author: string, page: number, signal?: AbortSignal) => {
  const params = new URLSearchParams({ page: String(page), v: "4" })
  const response = await fetch(
    `/api/authors/${encodeURIComponent(author)}/books?${params.toString()}`,
    {
      ...(signal ? { signal } : {}),
    },
  )

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "書籍情報を取得できませんでした")
  }

  return (await response.json()) as AuthorBooksResponse
}
