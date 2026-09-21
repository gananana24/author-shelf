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
  ])("楽天Booksの判型「%s」を内部区分「%s」として扱う", (size, expected) => {
    // Arrange
    const sut = getBookFormat

    // Act
    const actual = sut(size)

    // Assert
    expect(actual).toBe(expected)
  })

  it("判型の全角空白を無視して文庫として扱う", () => {
    // Arrange
    const sut = getBookFormat
    const size = "　文庫　"

    // Act
    const actual = sut(size)

    // Assert
    expect(actual).toBe("paperback")
  })
})
