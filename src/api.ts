import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { Router } from "@/api/router"

export const api = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: new URL(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787").toString(),
    })
  ],
})

