const normalizeAuthorName = (name: string) => name.replace(/\s/g, "").toLocaleLowerCase("ja")

export const hasMultipleAuthors = (authors: string[]) =>
  new Set(authors.map(normalizeAuthorName).filter(Boolean)).size > 1
