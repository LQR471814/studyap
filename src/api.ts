import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { Router } from "@/api/router"
import superjson from "superjson"

export const api = createTRPCClient<Router>({
  links: [
    httpBatchLink({
      url: new URL(
        import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787",
      ).toString(),
      transformer: superjson,
    }),
  ],
})

console.log("profile", await api.profile.query())
