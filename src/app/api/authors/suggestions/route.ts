import { NextResponse } from "next/server"
import { fetchAuthorSuggestions } from "@/server/books/author-books"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await fetchAuthorSuggestions(query)
    return NextResponse.json(
      { suggestions },
      {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
      },
    )
  } catch (error) {
    console.error("Failed to fetch author suggestions", error)
    return NextResponse.json(
      { message: "著者候補を取得できませんでした。時間をおいて再度お試しください。" },
      { status: 502 },
    )
  }
}
