import { hc } from 'hono/client'

import type { AppType } from '../../api'

/** Hono RPCを使って同一オリジンのShoka APIを呼び出すクライアント。 */
export const apiClient = hc<AppType>('/')
