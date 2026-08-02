import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => {
  return (
    <div className="min-h-svh bg-background">
      <aside
        aria-label="Shoka"
        className="fixed inset-y-0 left-0 z-10 flex w-16 flex-col items-center bg-background pt-20"
      >
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="size-7 rounded-full bg-[linear-gradient(135deg,#d9f99d_0%,#22c55e_55%,#047857_100%)] shadow-sm ring-1 ring-emerald-950/10"
          />
          <span
            className="text-sm font-semibold tracking-[0.18em]"
            style={{ writingMode: 'vertical-rl' }}
          >
            Shoka
          </span>
        </div>
      </aside>

      <div className="ml-16 min-h-svh">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
