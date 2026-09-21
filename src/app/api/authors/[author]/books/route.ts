import { NextResponse } from "next/server"
import { fetchAuthorBooks } from "@/server/books/author-books"

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/authors/[author]/books">,
) {
  const { author } = await params
  const normalizedAuthor = author.trim()
  const pageValue = new URL(request.url).searchParams.get("page") ?? "1"
  const page = Number(pageValue)

  if (
    normalizedAuthor.length < 2 ||
    normalizedAuthor.length > 100 ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100
  ) {
    return NextResponse.json({ message: "著者名を確認してください" }, { status: 400 })
  }

  try {
    const result = await fetchAuthorBooks(normalizedAuthor, page)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    })
  } catch (error) {
    console.error("Failed to fetch author books", error)
    return NextResponse.json(
      { message: "書籍情報を取得できませんでした。時間をおいて再度お試しください。" },
      { status: 502 },
    )
  }
}
