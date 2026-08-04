import { createFileRoute } from '@tanstack/react-router'

import AuthorPage from '@/features/book-gallery/pages/author-page'

export const Route = createFileRoute('/authors/$authorName')({
  component: AuthorPage,
  validateSearch: (search: Record<string, unknown>) => ({
    view: search.view === 'year' ? ('year' as const) : ('random' as const),
    seed: typeof search.seed === 'string' && search.seed.length > 0 ? search.seed : undefined,
  }),
})
