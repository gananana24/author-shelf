import type { BookEdition } from '../../shared/book.js'
import type { AuthorCandidate, BookCatalog, BookPage, ListBooksInput } from './book-catalog.js'

const authors: AuthorCandidate[] = [
  { name: '青空 春子' },
  { name: '青空 冬樹' },
  { name: '星野 夏美' },
]

const books: BookEdition[] = [
  {
    id: 'mock-blue-spring-1',
    title: '架空書房の朝',
    authors: ['青空 春子'],
    publisher: 'モック出版',
    publicationDate: {
      raw: '2024年4月1日',
      year: 2024,
      month: 4,
      day: 1,
      precision: 'day',
      sortKey: '2024-04-01',
    },
    format: '四六判',
    isbn: null,
    coverUrl: null,
    description: '画面確認用の架空の書籍です。',
    sourceUrl: null,
  },
]

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
