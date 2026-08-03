import type { BookEdition } from '../../shared/book.js'
import type { AuthorCandidate, BookCatalog, BookPage, ListBooksInput } from './book-catalog.js'

const authors: AuthorCandidate[] = [
  { name: '青空 春子' },
  { name: '青空 冬樹' },
  { name: '星野 夏美' },
]

const books: BookEdition[] = Array.from({ length: 30 }, (_, index) => {
  const sequence = index + 1
  const year = 2020 + Math.floor(index / 6)
  const month = (index % 12) + 1
  const day = (index % 28) + 1
  const paddedSequence = String(sequence).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  const paddedDay = String(day).padStart(2, '0')

  return {
    id: `mock-blue-spring-${paddedSequence}`,
    title: sequence === 1 ? '架空書房の朝' : `架空書房の本 ${paddedSequence}`,
    authors: sequence % 10 === 0 ? ['青空 春子', '星野 夏美'] : ['青空 春子'],
    publisher: sequence % 7 === 0 ? null : 'モック出版',
    publicationDate: {
      raw: `${year}年${month}月${day}日`,
      year,
      month,
      day,
      precision: 'day',
      sortKey: `${year}-${paddedMonth}-${paddedDay}`,
    },
    format: sequence % 5 === 0 ? null : '四六判',
    isbn: null,
    coverUrl: null,
    description: sequence % 4 === 0 ? null : '画面確認用の架空の書籍です。',
    sourceUrl: null,
  }
})

const normalizeText = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ')

/** 画面とAPIの疎通確認に使用する、外部通信を行わない書誌カタログ。 */
export const mockBookCatalog: BookCatalog = {
  async searchAuthors(query) {
    const normalizedQuery = normalizeText(query)

    return authors.filter(({ name }) => normalizeText(name).includes(normalizedQuery))
  },

  async listBooks(input: ListBooksInput): Promise<BookPage> {
    const items = books.filter(({ authors: bookAuthors }) => bookAuthors.includes(input.authorName))

    return {
      authorName: input.authorName,
      total: items.length,
      items,
      nextCursor: null,
    }
  },
}
