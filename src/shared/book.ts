/** 著者の刊行物を並べる方法。 */
export type BookView = 'random' | 'year'

/** 刊行日の情報がどの粒度まで判明しているかを表す。 */
export type PublicationPrecision =
  | 'day'
  | 'early-month'
  | 'mid-month'
  | 'late-month'
  | 'month'
  | 'year'
  | 'unknown'

/**
 * データ源の表記と、表示・並び替えに使用する正規化済みの刊行日を表す。
 */
export type PublicationDate = {
  /** データ源から取得した刊行日の原文。取得できない場合は`null`。 */
  raw: string | null
  /** 正規化した刊行年。判明しない場合は`null`。 */
  year: number | null
  /** 正規化した刊行月。判明しない場合は`null`。 */
  month: number | null
  /** 正規化した刊行日。判明しない場合は`null`。 */
  day: number | null
  /** 刊行日の精度。 */
  precision: PublicationPrecision
  /** 不完全な日付を含め、刊行物を安定して並べ替えるためのキー。 */
  sortKey: string
}

/**
 * 一覧と詳細表示で扱う、データ源に依存しない紙書籍の刊行版を表す。
 */
export type BookEdition = {
  /** ISBNまたはデータ源の識別子を基にした一意で安定したID。 */
  id: string
  /** 書名。 */
  title: string
  /** 共著者を含む著者名の一覧。 */
  authors: string[]
  /** 出版社。取得できない場合は`null`。 */
  publisher: string | null
  /** 表示・並び替えに使用する刊行日。 */
  publicationDate: PublicationDate
  /** 判型。取得できない場合は`null`。 */
  format: string | null
  /** 正規化済みのISBN。取得できない場合は`null`。 */
  isbn: string | null
  /** 書影のURL。取得できない場合は`null`。 */
  coverUrl: string | null
  /** あらすじまたは内容紹介。取得できない場合は`null`。 */
  description: string | null
  /** 利用者が書誌情報を確認できるデータ源の商品ページURL。 */
  sourceUrl: string | null
}
