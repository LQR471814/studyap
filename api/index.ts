import { instrument, type ResolveConfigFn } from "@microlabs/otel-cf-workers"
import handler from "./main"

import type { Env } from "./main"

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

export type { Env }

export default instrument(handler, config)
