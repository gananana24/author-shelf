import { describe, expect, it } from "vitest"
import { hasMultipleAuthors } from "./book-authors"

describe("hasMultipleAuthors", () => {
  it("空白だけが異なる著者名は同一人物として扱う", () => {
    // Arrange
    const sut = hasMultipleAuthors
    const authors = ["東野圭吾", "東野 圭吾", "東野　圭吾"]

    // Act
    const actual = sut(authors)

    // Assert
    expect(actual).toBe(false)
  })

  it("異なる名義が含まれる書籍は複数名義として扱う", () => {
    // Arrange
    const sut = hasMultipleAuthors
    const authors = ["東野圭吾", "456"]

    // Act
    const actual = sut(authors)

    // Assert
    expect(actual).toBe(true)
  })

  it("著者が一人だけの書籍は単著として扱う", () => {
    // Arrange
    const sut = hasMultipleAuthors
    const authors = ["東野圭吾"]

    // Act
    const actual = sut(authors)

    // Assert
    expect(actual).toBe(false)
  })
})
