// oxlint-disable-next-line typescript/triple-slash-reference -- Wrangler's generated Env declarations are ambient.
/// <reference path="../../worker-configuration.d.ts" />

import { Hono } from 'hono'

import { createRakutenBookCatalog } from './services/rakuten-book-catalog.js'

const maxAuthorQueryLength = 100

const normalizeQuery = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ')

const createCatalog = (env: Cloudflare.Env) => {
  if (env.BOOK_CATALOG_SOURCE !== 'rakuten') {
    throw new Error(`Unsupported book catalog source: ${env.BOOK_CATALOG_SOURCE}`)
  }

  return createRakutenBookCatalog(env)
}

const catalogError = (error: unknown, operation: string) => {
  console.error('book_catalog_request_failed', {
    operation,
    message: error instanceof Error ? error.message : String(error),
  })
}

const app = new Hono<{ Bindings: Cloudflare.Env }>()
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

    try {
      const authors = await createCatalog(c.env).searchAuthors(query)

      return c.json({ authors })
    } catch (error) {
      catalogError(error, 'search_authors')
      return c.json(
        { error: { code: 'catalog_unavailable', message: '書誌情報を取得できませんでした。' } },
        502,
      )
    }
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

    try {
      const page = await createCatalog(c.env).listBooks({ authorName, view, cursor, seed })

      return c.json({ ...page, source: 'rakuten' as const })
    } catch (error) {
      catalogError(error, 'list_books')
      return c.json(
        { error: { code: 'catalog_unavailable', message: '書誌情報を取得できませんでした。' } },
        502,
      )
    }
  })

export type AppType = typeof app
export default app
