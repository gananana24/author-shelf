import type { AuthorBook, AuthorBooksResponse, AuthorSuggestion } from "@/features/author/types"

const RAKUTEN_ENDPOINT = "https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404"
const PAGE_SIZE = 30
const MAX_PAGES = 100
const QUALIFIER_DAY: Record<string, number> = { 上旬: 1, 中旬: 11, 下旬: 21 }

type RakutenItem = {
  title?: string
  itemCaption?: string
  author?: string
  publisherName?: string
  size?: string
  isbn?: string
  salesDate?: string
  itemUrl?: string
  largeImageUrl?: string
  mediumImageUrl?: string
  smallImageUrl?: string
}

type RakutenResponse = {
  count?: number
  pageCount?: number
  Items?: RakutenItem[]
  items?: RakutenItem[]
}

export const isExcludedRakutenItem = (item: RakutenItem) => {
  const title = item.title?.normalize("NFKC").trim() ?? ""
  const size = item.size?.normalize("NFKC").trim() ?? ""

  return (
    title.startsWith("【バーゲン本】") ||
    /セット|BOX|ボックス/i.test(title) ||
    /^(?:セット商品|Complete set)$/i.test(size)
  )
}

const normalizeIsbn = (value: string | undefined) => {
  if (!value) return undefined
  const isbn = value.replace(/[^0-9X]/gi, "").toUpperCase()
  if (/^\d{13}$/.test(isbn)) return isbn
  if (!/^\d{9}[0-9X]$/.test(isbn)) return undefined

  const stem = `978${isbn.slice(0, 9)}`
  const sum = [...stem].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  )
  return `${stem}${(10 - (sum % 10)) % 10}`
}

export const normalizePublishedDate = (value: string | undefined) => {
  const match = value
    ?.trim()
    .match(/(\d{4})(?:年|[.\-/])?(?:(\d{1,2})(?:月|[.\-/])?)?(?:(\d{1,2})日?)?(上旬|中旬|下旬)?/)
  if (!match?.[1]) {
    return { display: undefined, sortDate: "9999-99-99", year: undefined }
  }

  const year = Number(match[1])
  const month = match[2] ? Number(match[2]) : undefined
  const qualifier = match[4]
  const day = match[3] ? Number(match[3]) : qualifier ? QUALIFIER_DAY[qualifier] : undefined
  const displayDay = match[3] ? `${Number(match[3])}日` : qualifier

  return {
    display: `${year}年${month ? `${month}月` : ""}${displayDay ?? ""}`,
    sortDate: `${year}-${String(month ?? 99).padStart(2, "0")}-${String(day ?? 99).padStart(2, "0")}`,
    year,
  }
}

const getCredentials = () => {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID
  const accessKey = process.env.RAKUTEN_ACCESS_KEY
  const appUrlValue = process.env.RAKUTEN_APP_URL
  if (!applicationId || !accessKey || !appUrlValue) {
    throw new Error("楽天Books APIの環境変数が設定されていません")
  }

  const appUrl = new URL(appUrlValue)
  if (appUrl.protocol !== "https:") {
    throw new Error("RAKUTEN_APP_URLにはHTTPSのURLを設定してください")
  }

  return { applicationId, accessKey, appUrl }
}

const fetchPage = async (author: string, page: number) => {
  const { applicationId, accessKey, appUrl } = getCredentials()
  const params = new URLSearchParams({
    applicationId,
    author,
    format: "json",
    formatVersion: "2",
    hits: String(PAGE_SIZE),
    page: String(page),
    booksGenreId: "001",
    outOfStockFlag: "1",
    sort: "+releaseDate",
  })
  const response = await fetch(`${RAKUTEN_ENDPOINT}?${params}`, {
    headers: {
      accessKey,
      Origin: appUrl.origin,
      Referer: appUrl.href,
    },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(20000),
  })
  if (response.status === 404) return { count: 0, pageCount: 0, items: [] }
  if (!response.ok) throw new Error(`楽天Books API returned ${response.status}`)
  return (await response.json()) as RakutenResponse
}

export const fetchAuthorSuggestions = async (query: string): Promise<AuthorSuggestion[]> => {
  const { applicationId, accessKey, appUrl } = getCredentials()
  const params = new URLSearchParams({
    applicationId,
    author: query,
    format: "json",
    formatVersion: "2",
    hits: String(PAGE_SIZE),
    page: "1",
    booksGenreId: "001",
    outOfStockFlag: "1",
    sort: "standard",
  })
  const response = await fetch(`${RAKUTEN_ENDPOINT}?${params}`, {
    headers: {
      accessKey,
      Origin: appUrl.origin,
      Referer: appUrl.href,
    },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(20000),
  })
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`楽天Books API returned ${response.status}`)

  const result = (await response.json()) as RakutenResponse
  const normalizedQuery = query.replace(/\s/g, "").toLocaleLowerCase("ja")
  const candidates = new Map<string, { name: string; count: number }>()

  for (const item of result.Items ?? result.items ?? []) {
    const authorName = item.author?.trim()
    if (!authorName || /[／/、]/.test(authorName)) continue

    const normalizedName = authorName.replace(/\s/g, "").toLocaleLowerCase("ja")
    if (normalizedName.includes(normalizedQuery)) {
      const existing = candidates.get(normalizedName)
      candidates.set(normalizedName, {
        name: !existing || authorName.length < existing.name.length ? authorName : existing.name,
        count: (existing?.count ?? 0) + 1,
      })
    }
  }

  return [...candidates.values()]
    .sort(
      (candidateA, candidateB) =>
        Number(
          candidateB.name.replace(/\s/g, "").toLocaleLowerCase("ja").startsWith(normalizedQuery),
        ) -
          Number(
            candidateA.name.replace(/\s/g, "").toLocaleLowerCase("ja").startsWith(normalizedQuery),
          ) ||
        candidateB.count - candidateA.count ||
        candidateA.name.localeCompare(candidateB.name, "ja"),
    )
    .slice(0, 8)
    .map(({ name }) => ({ name }))
}

export const normalizeRakutenItem = (
  item: RakutenItem,
  author: string,
  index: number,
): AuthorBook | null => {
  const title = item.title?.trim()
  const sourceUrl = item.itemUrl?.trim()
  if (!title || !sourceUrl) return null

  const date = normalizePublishedDate(item.salesDate)
  const isbn = normalizeIsbn(item.isbn)
  const coverUrl = item.largeImageUrl ?? item.mediumImageUrl
  const hasCover = coverUrl && !coverUrl.includes("/noimage_")
  const authors = item.author
    ? item.author
        .split(/[／/、]/)
        .map((name) => name.trim())
        .filter(Boolean)
    : [author]

  return {
    id: isbn ?? `${title}-${item.salesDate ?? "unknown"}-${index}`,
    title,
    authors: authors.length > 0 ? authors : [author],
    sourceUrl,
    sortDate: date.sortDate,
    ...(date.display ? { publishedDate: date.display } : {}),
    ...(date.year ? { year: date.year } : {}),
    ...(isbn ? { isbn } : {}),
    ...(item.publisherName ? { publisher: item.publisherName } : {}),
    ...(item.size ? { size: item.size } : {}),
    ...(item.itemCaption ? { description: item.itemCaption } : {}),
    ...(hasCover ? { coverUrl } : {}),
  }
}

export const fetchAuthorBooks = async (
  author: string,
  page: number,
): Promise<AuthorBooksResponse> => {
  const response = await fetchPage(author, page)
  const books = (response.Items ?? response.items ?? [])
    .filter((item) => !isExcludedRakutenItem(item))
    .map((item, index) => normalizeRakutenItem(item, author, index))
    .filter((book): book is AuthorBook => book !== null)

  const uniqueBooks = [
    ...new Map(
      books.map((book) => [book.isbn ?? `${book.title}-${book.publisher}-${book.sortDate}`, book]),
    ).values(),
  ].sort(
    (a, b) =>
      a.sortDate.localeCompare(b.sortDate) ||
      a.title.localeCompare(b.title, "ja") ||
      (a.isbn ?? "").localeCompare(b.isbn ?? ""),
  )

  const pageCount = Math.min(response.pageCount ?? 1, MAX_PAGES)

  return {
    author,
    books: uniqueBooks,
    total: response.count ?? uniqueBooks.length,
    page,
    nextPage: page < pageCount ? page + 1 : null,
  }
}
