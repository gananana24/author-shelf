import { describe, expect, it } from "vitest"
import { getBookFormat } from "./book-formats"

describe("getBookFormat", () => {
  it.each([
    ["単行本", "hardcover"],
    ["文庫", "paperback"],
    ["文庫判", "paperback"],
    ["新書", "shinsho"],
    ["新書判", "shinsho"],
    ["コミック", "other"],
    ["全集・双書", "other"],
    ["絵本", "other"],
    [undefined, "other"],
  ])("maps %s to %s", (size, expected) => {
    expect(getBookFormat(size)).toBe(expected)
  })

  it("normalizes full-width variants before classifying", () => {
    expect(getBookFormat("　文庫　")).toBe("paperback")
  })
})
