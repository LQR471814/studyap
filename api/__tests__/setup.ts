import { createDB } from "@/lib/db"
import { createClient } from "@libsql/client"
import { GenericContainer, Wait } from "testcontainers"
import { migrate } from "drizzle-orm/sqlite-proxy/migrator"
import { join, dirname } from "node:path"
import { t } from "../trpc"
import { generateAll } from "@/cmd/generator/dummy"
import { user } from "@/lib/schema/schema"
import { context } from "@/cmd/generator/context"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { router } from "../router"

export async function setupDummyDB() {
  // setup sqld instance and client
  const sqld = await new GenericContainer("ghcr.io/libsql/sqld:latest")
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forLogMessage("listening for HTTP requests on"))
    .start()

  const libsql = createClient({
    url: `http://${sqld.getHost()}:${sqld.getFirstMappedPort()}`,
  })
  const db = createDB(libsql)

  // migrate DB schema
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

  // setup dummy user account
  const testEmail = "test.user@email.com"
  await db.insert(user).values({
    email: testEmail,
  })

  // setup openai client
  const llm = isomorphicLLMFromEnv()

  // setup generation context
  const dummyData = await generateAll(context(db, llm))

  // setup local trpc API
  const createApi = t.createCallerFactory(router)
  const api = createApi({ userEmail: testEmail, db, llm })

  return { db, api, testEmail, ...dummyData }
}
