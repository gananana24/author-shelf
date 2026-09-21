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
  it("keeps partial dates partial while creating a stable sort key", () => {
    expect(normalizePublishedDate("2009.8")).toEqual({
      display: "2009年8月",
      sortDate: "2009-08-99",
      year: 2009,
    })
  })

  it("uses the documented day equivalents for release-date qualifiers", () => {
    expect(normalizePublishedDate("2026年9月中旬")).toEqual({
      display: "2026年9月中旬",
      sortDate: "2026-09-11",
      year: 2026,
    })
  })

  it("places unknown dates last", () => {
    expect(normalizePublishedDate(undefined)).toEqual({
      display: undefined,
      sortDate: "9999-99-99",
      year: undefined,
    })
  })
})

describe("normalizeRakutenItem", () => {
  it("maps a Rakuten Books item to the app model", () => {
    expect(
      normalizeRakutenItem(
        {
          title: "赤い指",
          author: "東野圭吾／山田太郎",
          publisherName: "講談社",
          size: "文庫",
          isbn: "978-4-06-276444-5",
          itemCaption: "加賀恭一郎シリーズ。",
          salesDate: "2009年08月",
          itemUrl: "https://books.rakuten.co.jp/example",
          largeImageUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg",
        },
        "東野圭吾",
        0,
      ),
    ).toEqual({
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
    })
  })

  it("uses the designed fallback when Rakuten returns its no-image asset", () => {
    expect(
      normalizeRakutenItem(
        {
          title: "書影のない本",
          author: "著者名",
          salesDate: "2020年01月",
          itemUrl: "https://books.rakuten.co.jp/example",
          largeImageUrl:
            "https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/noimage_01.gif",
        },
        "著者名",
        0,
      ),
    ).not.toHaveProperty("coverUrl")
  })
})

describe("isExcludedRakutenItem", () => {
  it.each([
    "殺人の門 新装版 上下巻セット",
    "加賀恭一郎シリーズ 全巻セット",
    "作品集BOX",
    "【バーゲン本】パラドックス13",
  ])("excludes non-single-book products: %s", (title) => {
    expect(isExcludedRakutenItem({ title })).toBe(true)
  })

  it("keeps a single book even when Rakuten classifies it as 全集・双書", () => {
    expect(isExcludedRakutenItem({ title: "鳥人計画", size: "全集・双書" })).toBe(false)
  })
})

describe("fetchAuthorBooks", () => {
  it("loads one Rakuten page and supports the Books API Items field", async () => {
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

    const result = await fetchAuthorBooks("東野圭吾", 1)

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
    expect(result).toMatchObject({
      author: "東野圭吾",
      total: 31,
      page: 1,
      nextPage: 2,
      books: [{ title: "放課後", publishedDate: "1985年9月" }],
    })
  })
})

describe("fetchAuthorSuggestions", () => {
  it("extracts and ranks matching author names from Rakuten books", async () => {
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

    await expect(fetchAuthorSuggestions("東野")).resolves.toEqual([
      { name: "東野圭吾" },
      { name: "東野さやか" },
      { name: "佐藤東野" },
    ])
  })

  it("does not suggest a combined multi-author value", async () => {
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

    await expect(fetchAuthorSuggestions("伊坂")).resolves.toEqual([])
  })
})
