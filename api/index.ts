import { Env, router } from "./router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await fetchRequestHandler({
      endpoint: "/",
      req: request,
      router,
      createContext() {
        return env
      }
    })
    for (const key in CORS_HEADERS) {
      res.headers.set(key, CORS_HEADERS[key])
    }
    return res
  },
};
