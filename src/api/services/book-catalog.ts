import type { BookEdition } from '../../shared/book.js'

/** 著者検索で利用者へ提示する候補を表す。 */
export type AuthorCandidate = {
  /** 表示と著者別検索に使用する著者名。 */
  name: string
}

/** 著者の本を並べる方法を表す。 */
export type BookView = 'random' | 'year'

/** 著者別書籍一覧を取得する条件を表す。 */
export type ListBooksInput = {
  /** 一覧を取得する著者名。 */
  authorName: string
  /** 一覧の表示順。 */
  view: BookView
  /** 続きを取得するために前回のレスポンスから渡された値。 */
  cursor: string | null
  /** ランダム表示の順序を再現するための値。 */
  seed: string
}

/** 著者別書籍一覧の1ページ分を表す。 */
export type BookPage = {
  /** 一覧の対象となる著者名。 */
  authorName: string
  /** ページング前の刊行物総数。 */
  total: number
  /** このページに含まれる刊行物。 */
  items: BookEdition[]
  /** 次ページがある場合のカーソル。最終ページでは`null`。 */
  nextCursor: string | null
}

/**
 * 書誌データ源に依存せず、著者候補と著者別書籍一覧を取得する境界。
 */
export interface BookCatalog {
  /** 検索語に一致する著者候補を返す。 */
  searchAuthors(query: string): Promise<AuthorCandidate[]>

  /** 指定した著者の刊行物を1ページ分返す。 */
  listBooks(input: ListBooksInput): Promise<BookPage>
}
