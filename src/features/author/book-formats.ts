export const BOOK_FORMAT_VALUES = ["hardcover", "paperback", "shinsho", "other"] as const

export type BookFormat = (typeof BOOK_FORMAT_VALUES)[number]

export const BOOK_FORMAT_OPTIONS: ReadonlyArray<{ value: BookFormat | ""; label: string }> = [
  { value: "", label: "すべて" },
  { value: "hardcover", label: "単行本" },
  { value: "paperback", label: "文庫" },
  { value: "shinsho", label: "新書" },
  { value: "other", label: "その他" },
]

export const getBookFormat = (size: string | undefined): BookFormat => {
  const normalizedSize = size?.normalize("NFKC").trim() ?? ""

  if (normalizedSize === "単行本") return "hardcover"
  if (normalizedSize.startsWith("文庫")) return "paperback"
  if (normalizedSize.startsWith("新書")) return "shinsho"
  return "other"
}
