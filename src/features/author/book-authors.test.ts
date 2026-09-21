import { describe, expect, it } from "vitest"
import { hasMultipleAuthors } from "./book-authors"

describe("hasMultipleAuthors", () => {
  it("treats whitespace variants of the same author as one name", () => {
    expect(hasMultipleAuthors(["東野圭吾", "東野 圭吾", "東野　圭吾"])).toBe(false)
  })

  it("detects a book with another credited name", () => {
    expect(hasMultipleAuthors(["東野圭吾", "456"])).toBe(true)
  })

  it("keeps a single credited author in the default view", () => {
    expect(hasMultipleAuthors(["東野圭吾"])).toBe(false)
  })
})
