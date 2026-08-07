import { Hono } from "hono"

export const helloRoute = new Hono().get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Hello, world!",
  })
})
