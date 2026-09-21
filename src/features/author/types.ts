export type AuthorBook = {
  id: string
  title: string
  authors: string[]
  publisher?: string
  publishedDate?: string
  sortDate: string
  year?: number
  isbn?: string
  description?: string
  coverUrl?: string
  sourceUrl: string
  size?: string
}

export type AuthorSuggestion = {
  name: string
}

export type AuthorBooksResponse = {
  author: string
  books: AuthorBook[]
  total: number
  page: number
  nextPage: number | null
}
