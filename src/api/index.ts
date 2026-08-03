import { Hono } from 'hono'

import { mockBookCatalog } from './services/mock-book-catalog.js'

const maxAuthorQueryLength = 100

const normalizeQuery = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ')

const app = new Hono()
  .get('/api/health', (c) => {
    return c.json({ status: 'ok' })
  })
  .get('/api/authors', async (c) => {
    const query = normalizeQuery(c.req.query('q') ?? '')

    if (query.length === 0 || query.length > maxAuthorQueryLength) {
      return c.json(
        {
          error: {
            code: 'invalid_query',
            message: `検索語は1文字以上${maxAuthorQueryLength}文字以下で入力してください。`,
          },
        },
        400,
      )
    }

    const authors = await mockBookCatalog.searchAuthors(query)

    return c.json({ authors })
  })
  .get('/api/authors/:authorName/books', async (c) => {
    const authorName = normalizeQuery(c.req.param('authorName'))
    const view = c.req.query('view') ?? 'random'
    const cursor = c.req.query('cursor') ?? null
    const seed = normalizeQuery(c.req.query('seed') ?? 'preview')

    if (authorName.length === 0 || authorName.length > maxAuthorQueryLength) {
      return c.json(
        {
          error: {
            code: 'invalid_author_name',
            message: `著者名は1文字以上${maxAuthorQueryLength}文字以下で指定してください。`,
          },
        },
        400,
      )
    }

    if (view !== 'random' && view !== 'year') {
      return c.json(
        {
          error: {
            code: 'invalid_view',
            message: '表示方法が正しくありません。',
          },
        },
        400,
      )
    }

    if (cursor !== null && !/^\d+$/.test(cursor)) {
      return c.json(
        {
          error: {
            code: 'invalid_cursor',
            message: 'ページ情報が正しくありません。',
          },
        },
        400,
      )
    }

    if (seed.length === 0 || seed.length > maxAuthorQueryLength) {
      return c.json(
        {
          error: {
            code: 'invalid_seed',
            message: '並び順の情報が正しくありません。',
          },
        },
        400,
      )
    }

    const page = await mockBookCatalog.listBooks({ authorName, view, cursor, seed })

    return c.json({ ...page, source: 'mock' as const })
  })

export type AppType = typeof app
export default app
