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

export type AppType = typeof app
export default app
