"use client"

import { useHello } from "../hooks/use-hello"

export const HelloMessage = () => {
  const { data, isPending, isError } = useHello()

  if (isPending) {
    return <p>Loading...</p>
  }

  if (isError) {
    return <p>Hello APIの取得に失敗しました</p>
  }

  return <p>{data.message}</p>
}
