import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fetchAuthorBooks,
  fetchAuthorSuggestions,
  isExcludedRakutenItem,
  normalizePublishedDate,
  normalizeRakutenItem,
} from "./author-books"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("normalizePublishedDate", () => {
  it("年月だけの刊行日は日を補完せず安定したソートキーを返す", () => {
    // Arrange
    const sut = normalizePublishedDate
    const publishedDate = "2009.8"
    const expected = {
      display: "2009年8月",
      sortDate: "2009-08-99",
      year: 2009,
    }

    // Act
    const actual = sut(publishedDate)

    // Assert
    expect(actual).toEqual(expected)
  })

  it("中旬の刊行日は11日相当のソートキーを返す", () => {
    // Arrange
    const sut = normalizePublishedDate
    const publishedDate = "2026年9月中旬"
    const expected = {
      display: "2026年9月中旬",
      sortDate: "2026-09-11",
      year: 2026,
    }

    // Act
    const actual = sut(publishedDate)

    // Assert
    expect(actual).toEqual(expected)
  })

  it("刊行日が不明な書籍は既知の日付より後ろへ並ぶソートキーを返す", () => {
    // Arrange
    const sut = normalizePublishedDate
    const publishedDate = undefined
    const expected = {
      display: undefined,
      sortDate: "9999-99-99",
      year: undefined,
    }

    // Act
    const actual = sut(publishedDate)

    // Assert
    expect(actual).toEqual(expected)
  })
})

describe("normalizeRakutenItem", () => {
  it("楽天Booksの商品をアプリで扱う書籍情報へ変換する", () => {
    // Arrange
    const sut = normalizeRakutenItem
    const item = {
      title: "赤い指",
      author: "東野圭吾／山田太郎",
      publisherName: "講談社",
      size: "文庫",
      isbn: "978-4-06-276444-5",
      itemCaption: "加賀恭一郎シリーズ。",
      salesDate: "2009年08月",
      itemUrl: "https://books.rakuten.co.jp/example",
      largeImageUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg",
    }
    const expected = {
      id: "9784062764445",
      title: "赤い指",
      authors: ["東野圭吾", "山田太郎"],
      publisher: "講談社",
      publishedDate: "2009年8月",
      sortDate: "2009-08-99",
      year: 2009,
      isbn: "9784062764445",
      description: "加賀恭一郎シリーズ。",
      coverUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg",
      sourceUrl: "https://books.rakuten.co.jp/example",
      size: "文庫",
    }

    // Act
    const actual = sut(item, "東野圭吾", 0)

    // Assert
    expect(actual).toEqual(expected)
  })

  it("楽天Booksのnoimage画像は書影なしとして扱う", () => {
    // Arrange
    const sut = normalizeRakutenItem
    const item = {
      title: "書影のない本",
      author: "著者名",
      salesDate: "2020年01月",
      itemUrl: "https://books.rakuten.co.jp/example",
      largeImageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/noimage_01.gif",
    }

    // Act
    const actual = sut(item, "著者名", 0)

    // Assert
    expect(actual).not.toHaveProperty("coverUrl")
  })
})

describe("isExcludedRakutenItem", () => {
  it.each([
    "殺人の門 新装版 上下巻セット",
    "加賀恭一郎シリーズ 全巻セット",
    "作品集BOX",
    "【バーゲン本】パラドックス13",
  ])("単品の書籍ではない「%s」を除外する", (title) => {
    // Arrange
    const sut = isExcludedRakutenItem

    // Act
    const actual = sut({ title })

    // Assert
    expect(actual).toBe(true)
  })

  it("全集・双書に分類された単品の書籍は表示対象にする", () => {
    // Arrange
    const sut = isExcludedRakutenItem
    const item = { title: "鳥人計画", size: "全集・双書" }

    // Act
    const actual = sut(item)

    // Assert
    expect(actual).toBe(false)
  })
})

describe("fetchAuthorBooks", () => {
  it("楽天Booksの1ページを取得し、単品の書籍だけを次ページ情報とともに返す", async () => {
    // Arrange
    const sut = fetchAuthorBooks
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "application-id")
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-key")
    vi.stubEnv("RAKUTEN_APP_URL", "https://example.com/books")
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          count: 31,
          pageCount: 2,
          Items: [
            {
              title: "放課後",
              author: "東野圭吾",
              isbn: "9784062023429",
              salesDate: "1985年09月",
              itemUrl: "https://books.rakuten.co.jp/example",
            },
            {
              title: "放課後 上下巻セット",
              author: "東野圭吾",
              isbn: "9780000000000",
              salesDate: "1985年09月",
              itemUrl: "https://books.rakuten.co.jp/set-example",
            },
          ],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    // Act
    const actual = await sut("東野圭吾", 1)

    // Assert
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.objectContaining({
        headers: {
          accessKey: "access-key",
          Origin: "https://example.com",
          Referer: "https://example.com/books",
        },
      }),
    )
    expect(actual).toMatchObject({
      author: "東野圭吾",
      total: 31,
      page: 1,
      nextPage: 2,
      books: [{ title: "放課後", publishedDate: "1985年9月" }],
    })
  })
})

describe("fetchAuthorSuggestions", () => {
  it("楽天Booksの商品から検索語に一致する著者候補を抽出して並べる", async () => {
    // Arrange
    const sut = fetchAuthorSuggestions
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "application-id")
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-key")
    vi.stubEnv("RAKUTEN_APP_URL", "https://example.com")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            Items: [
              { author: "東野圭吾" },
              { author: "東野圭吾／山田太郎" },
              { author: "東野圭吾/原田ひ香" },
              { author: "東野 圭吾" },
              { author: "東野　圭吾" },
              { author: "東野さやか" },
              { author: "佐藤東野" },
            ],
          }),
          { status: 200 },
        ),
      ),
    )

    // Act
    const actual = await sut("東野")

    // Assert
    expect(actual).toEqual([{ name: "東野圭吾" }, { name: "東野さやか" }, { name: "佐藤東野" }])
  })

  it("複数名義を連結した値は著者候補に含めない", async () => {
    // Arrange
    const sut = fetchAuthorSuggestions
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "application-id")
    vi.stubEnv("RAKUTEN_ACCESS_KEY", "access-key")
    vi.stubEnv("RAKUTEN_APP_URL", "https://example.com")
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            Items: [{ author: "伊坂 幸太郎/原田 ひ香/中山 七里/今村 昌弘" }],
          }),
          { status: 200 },
        ),
      ),
    )

    // Act
    const actual = await sut("伊坂")

    // Assert
    expect(actual).toEqual([])
  })
})
