import { dirname, join } from "node:path"
import { generateAll } from "@/cmd/generator/dummy"
import { type DB, createDB } from "@/lib/db"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { user } from "@/lib/schema/schema"
import { initializeOtelVitest } from "@/lib/telemetry/vitest"
import { createClient } from "@libsql/client"
import type { Span } from "@opentelemetry/api"
import { migrate } from "drizzle-orm/sqlite-proxy/migrator"
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers"
import { protectedRouter, t } from "../protected"
import { afterAll } from "vitest"

initializeOtelVitest("test:api")

const llm = isomorphicLLMFromEnv()

const containers: StartedTestContainer[] = []

afterAll(async () => {
  await Promise.all(containers.map((c) => c.stop()))
})

export async function setupDummyDB(span: Span) {
  // setup sqld instance and client
  const sqld = await new GenericContainer("ghcr.io/libsql/sqld:latest")
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forLogMessage("listening for HTTP requests on"))
    .start()

  containers.push(sqld)

  // prepare db
  const libsql = createClient({
    url: `http://${sqld.getHost()}:${sqld.getFirstMappedPort()}`,
  })
  const db = createDB(libsql)
  await migrate(
    db,
    (queries) => {
      return libsql.executeMultiple(queries.join(";"))
    },
    {
      migrationsFolder: join(
        dirname(new URL(import.meta.url).pathname),
        "../../drizzle",
      ),
    },
  )

  const dummyData = await generateAll(span, { db })
  return { db, ...dummyData }
}

export async function setupAPI(db: DB, span: Span, email: string) {
  // insert dummy data
  await db.insert(user).values({ email }).onConflictDoNothing()

  // setup local trpc API
  const createApi = t.createCallerFactory(protectedRouter)
  const api = createApi({
    userEmail: email,
    db,
    llm,
    span,
  })

  return { api, llm }
}
