// oxlint-disable-next-line typescript/triple-slash-reference -- Wrangler's generated Env declarations are ambient.
/// <reference path="../../../worker-configuration.d.ts" />

import type { BookEdition, PublicationDate, PublicationPrecision } from '../../shared/book.js'
import type { AuthorCandidate, BookCatalog, BookPage, ListBooksInput } from './book-catalog.js'

type RakutenBindings = Pick<
  Cloudflare.Env,
  'RAKUTEN_ACCESS_KEY' | 'RAKUTEN_APPLICATION_ID' | 'RAKUTEN_APPLICATION_URL'
>

type RakutenItem = {
  itemCode?: string
  title?: string
  author?: string
  publisherName?: string
  isbn?: string
  itemCaption?: string
  salesDate?: string
  size?: string
  largeImageUrl?: string
  itemUrl?: string
  affiliateUrl?: string
}

type RakutenResponse = {
  count?: number
  page?: number
  pageCount?: number
  items?: RakutenItem[]
  Items?: RakutenItem[]
  error?: string
  error_description?: string
  errors?: { errorCode?: number; errorMessage?: string }
}

const endpoint = 'https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404'
const requestTimeoutMs = 10_000

const normalizeAuthorName = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ')
const authorNameKey = (value: string) => normalizeAuthorName(value).replace(/\s/g, '')

const splitAuthors = (author: string | undefined) => {
  if (!author) return []
  return author
    .split(/[・／/,]/)
    .map(normalizeAuthorName)
    .filter(Boolean)
}

const parsePublicationDate = (rawValue: string | undefined): PublicationDate => {
  const raw = rawValue?.trim() || null
  const year = raw ? Number(raw.match(/(\d{4})年/)?.[1] ?? NaN) : null
  const month = raw ? Number(raw.match(/(\d{1,2})月/)?.[1] ?? NaN) : null
  const day = raw ? Number(raw.match(/(\d{1,2})日/)?.[1] ?? NaN) : null
  const precision: PublicationPrecision = day ? 'day' : month ? 'month' : year ? 'year' : 'unknown'

  return {
    raw,
    year: Number.isFinite(year) ? year : null,
    month: Number.isFinite(month) ? month : null,
    day: Number.isFinite(day) ? day : null,
    precision,
    sortKey: `${year || 0}-${month || 0}-${day || 0}`,
  }
}

const toBookEdition = (item: RakutenItem): BookEdition => {
  const title = item.title?.trim() || 'タイトル不明'
  const isbn = item.isbn?.trim() || null

  return {
    id: isbn || item.itemCode || `${title}-${item.salesDate || 'unknown'}`,
    title,
    authors: splitAuthors(item.author),
    publisher: item.publisherName?.trim() || null,
    publicationDate: parsePublicationDate(item.salesDate),
    format: item.size?.trim() || null,
    isbn,
    coverUrl: item.largeImageUrl?.trim() || null,
    description: item.itemCaption?.trim() || null,
    sourceUrl: item.affiliateUrl?.trim() || item.itemUrl?.trim() || null,
  }
}

const getItems = (result: RakutenResponse) => result.items ?? result.Items ?? []

const shuffle = <T>(items: T[], seed: string) => {
  let value = Array.from(seed).reduce((hash, character) => hash * 31 + character.charCodeAt(0), 7)
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280
    const target = Math.floor((value / 233280) * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }

  return result
}

class RakutenBookCatalog implements BookCatalog {
  private readonly bindings: RakutenBindings

  constructor(bindings: RakutenBindings) {
    this.bindings = bindings
  }

  private async search(params: URLSearchParams) {
    params.set('applicationId', this.bindings.RAKUTEN_APPLICATION_ID)
    params.set('format', 'json')
    params.set('formatVersion', '2')
    params.set('hits', '30')
    params.set('booksGenreId', '001')

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        accessKey: this.bindings.RAKUTEN_ACCESS_KEY,
        Referer: this.bindings.RAKUTEN_APPLICATION_URL,
        Origin: this.bindings.RAKUTEN_APPLICATION_URL,
        'User-Agent': 'Shoka/0.1 (book catalogue)',
      },
      signal: AbortSignal.timeout(requestTimeoutMs),
    })
    const result = (await response.json()) as RakutenResponse

    if (!response.ok || result.error) {
      const message =
        result.error_description || result.error || result.errors?.errorMessage || '不明なエラー'
      throw new Error(`楽天Books APIの取得に失敗しました（${response.status}: ${message}）`)
    }

    return result
  }

  async searchAuthors(query: string): Promise<AuthorCandidate[]> {
    const result = await this.search(new URLSearchParams({ author: query, page: '1' }))
    const names = new Map<string, string>()
    for (const name of getItems(result).flatMap((item) => splitAuthors(item.author))) {
      names.set(authorNameKey(name), name)
    }
    return [...names.values()].map((name) => ({ name }))
  }

  async listBooks(input: ListBooksInput): Promise<BookPage> {
    const page = Number(input.cursor ?? '1')
    const result = await this.search(
      new URLSearchParams({
        author: input.authorName,
        page: String(page),
        sort: input.view === 'year' ? '+releaseDate' : 'standard',
      }),
    )
    const items = getItems(result).map(toBookEdition)

    return {
      authorName: input.authorName,
      total: result.count ?? items.length,
      items: input.view === 'random' ? shuffle(items, input.seed) : items,
      nextCursor: result.pageCount && page < result.pageCount ? String(page + 1) : null,
    }
  }
}

export const createRakutenBookCatalog = (bindings: RakutenBindings): BookCatalog => {
  return new RakutenBookCatalog(bindings)
}
