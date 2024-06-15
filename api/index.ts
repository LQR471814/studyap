import { type ResolveConfigFn, instrument } from "@microlabs/otel-cf-workers"
import type { Env } from "./main"
import handler from "./main"

export type { Env }

const config: ResolveConfigFn = (env: Env) => {
  if (!env.HONEYCOMB_API_KEY) {
    return {
      exporter: {
        // this is a black-hole address
        url: "http://198.51.100.0",
      },
      service: { name: "cloudflare_workers" },
    }
  }
  return {
    exporter: {
      url: "https://api.honeycomb.io/v1/traces",
      headers: { "x-honeycomb-team": env.HONEYCOMB_API_KEY },
    },
    service: { name: "cloudflare_workers" },
  }
}

export default instrument(handler, config)
