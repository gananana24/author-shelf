import { createFileRoute } from '@tanstack/react-router'
import { hc } from 'hono/client'
import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { AppType } from '../../api'

export const Route = createFileRoute('/')({
  component: Index,
})

const client = hc<AppType>('/')

function Index() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const searchAuthors = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setMessage('検索中…')
    setIsSearching(true)

    try {
      const response = await client.api.authors.$get({ query: { q: query } })
      const result = await response.json()

      if ('error' in result) {
        setAuthors([])
        setMessage('')
        setError(result.error.message)
        return
      }

      setAuthors(result.authors.map(({ name }) => name))
      setMessage(result.authors.length === 0 ? '候補が見つかりませんでした。' : '')
    } catch {
      setAuthors([])
      setMessage('')
      setError('検索に失敗しました。時間をおいてもう一度お試しください。')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="min-h-svh">
      <section aria-label="著者検索">
        <div className="mx-auto flex min-h-16 max-w-7xl items-start gap-4 px-4 py-3 sm:px-8">
          <form className="w-full max-w-xl" onSubmit={searchAuthors}>
            <Field className="gap-1.5" data-invalid={Boolean(error)}>
              <FieldLabel className="sr-only" htmlFor="author-query">
                著者名
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="off"
                  className="h-10 bg-muted/40"
                  id="author-query"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="著者名で検索（例: 青空）"
                  type="search"
                  value={query}
                />
                <Button className="h-10 px-5" disabled={isSearching} type="submit">
                  {isSearching ? '検索中…' : '検索'}
                </Button>
              </div>
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </form>
          <span className="hidden pt-2 text-xs text-muted-foreground sm:inline">モックデータ</span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Author shelf</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            著者の本を眺める
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            著者を検索すると、刊行された本がこの場所に並びます。現在は架空の著者名「青空」で試せます。
          </p>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {authors.length > 0 && (
          <div aria-labelledby="author-results-heading">
            <h2 className="text-sm font-medium" id="author-results-heading">
              著者候補
            </h2>
            <ul className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {authors.map((author) => (
                <li className="py-3 text-sm font-medium" key={author}>
                  {author}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
