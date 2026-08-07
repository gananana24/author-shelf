import { apiClient } from "@/lib/api-client"

export const fetchHello = async () => {
  const response = await apiClient.api.hello.$get()

  if (!response.ok) {
    throw new Error("Failed to fetch hello")
  }

  return response.json()
}
