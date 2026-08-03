import { createFileRoute } from '@tanstack/react-router'

import AboutPage from '@/features/home/pages/about-page'

export const Route = createFileRoute('/about')({ component: AboutPage })
