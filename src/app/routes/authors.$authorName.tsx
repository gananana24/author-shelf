import { createFileRoute } from '@tanstack/react-router'

import AuthorPage from '@/features/book-gallery/pages/author-page'

export const Route = createFileRoute('/authors/$authorName')({ component: AuthorPage })
