import { dirname, join } from "node:path"
import { generateAll } from "@/cmd/generator/dummy"
import { createDB } from "@/lib/db"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { question, stimulus, subject, unit, user } from "@/lib/schema/schema"
import { initializeOtelVitest } from "@/lib/telemetry/vitest"
import { createClient } from "@libsql/client"
import type { Span } from "@opentelemetry/api"
import { migrate } from "drizzle-orm/sqlite-proxy/migrator"
import { GenericContainer, Wait } from "testcontainers"
import { protectedRouter, t } from "../protected"

initializeOtelVitest("test:api")

export async function setupDummyDB(span: Span, email: string) {
  // setup sqld instance and client
  const sqld = await new GenericContainer("ghcr.io/libsql/sqld:latest")
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forLogMessage("listening for HTTP requests on"))
    .start()

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

  // insert dummy data
  await db.insert(user).values({ email })
  const dummyData = await generateAll(span, { db })

  span.addEvent("db snapshot (1)", {
    "custom.users": JSON.stringify(await db.select().from(user)),
    "custom.subject": JSON.stringify(await db.select().from(subject)),
    "custom.units": JSON.stringify(await db.select().from(unit)),
    "custom.stimuli": JSON.stringify(await db.select().from(stimulus)),
    "custom.questions": JSON.stringify(await db.select().from(question)),
  })

  // setup local trpc API
  const llm = isomorphicLLMFromEnv()
  const createApi = t.createCallerFactory(protectedRouter)
  const api = createApi({
    userEmail: email,
    db,
    llm,
    span,
  })

  span.addEvent("db snapshot (2)", {
    "custom.users": JSON.stringify(await db.select().from(user)),
    "custom.subject": JSON.stringify(await db.select().from(subject)),
    "custom.units": JSON.stringify(await db.select().from(unit)),
    "custom.stimuli": JSON.stringify(await db.select().from(stimulus)),
    "custom.questions": JSON.stringify(await db.select().from(question)),
  })

  return { db, api, testEmail: email, ...dummyData }
}
