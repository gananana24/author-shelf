import { Hono } from "hono"

import { helloRoute } from "./routes/hello"

export const routes = new Hono().basePath("/api").route("/hello", helloRoute)

export const app = routes

export type AppType = typeof routes
