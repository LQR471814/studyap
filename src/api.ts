import type { ProtectedRouter } from "@/api/protected"
import type { PublicRouter } from "@/api/public"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import superjson from "superjson"
import { writable } from "svelte/store"

export const publicApi = createTRPCClient<PublicRouter>({
  links: [
    httpBatchLink({
      url: new URL(
        "/public",
        import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787",
      ).toString(),
      transformer: superjson,
    }),
  ],
})

export let protectedApi = createTRPCClient<ProtectedRouter>({
  links: [],
})

export const token = writable<string | undefined>(
  localStorage.getItem("token") ?? undefined,
)
token.subscribe((t) => {
  if (!t) {
    localStorage.removeItem("token")
    return
  }

  localStorage.setItem("token", t)
  protectedApi = createTRPCClient<ProtectedRouter>({
    links: [
      httpBatchLink({
        url: new URL(
          "/protected",
          import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787",
        ).toString(),
        transformer: superjson,
        headers: {
          Authorization: `Bearer ${t}`,
        },
      }),
    ],
  })
})
