"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchHello } from "../api/fetch-hello"

export const useHello = () => {
  return useQuery({
    queryKey: ["hello"],
    queryFn: fetchHello,
  })
}
