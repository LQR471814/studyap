import { createDB } from "@/lib/db"
import { createClient } from "@libsql/client"
import { GenericContainer, Wait } from "testcontainers"
import { migrate } from "drizzle-orm/sqlite-proxy/migrator"
import { join, dirname } from "node:path"
import OpenAI from "openai"
import { t } from "../common"
import { testsRouter } from "../tests"
import { generateAll } from "@/cmd/generator/dummy"
import { user } from "@/lib/schema/schema"
import { context } from "@/cmd/generator/context"

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
    name: "test user",
  })

  // setup openai client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // setup generation context
  const dummyData = await generateAll(context(db, openai))

  // setup local trpc API
  const createApi = t.createCallerFactory(testsRouter)
  const api = createApi({ userEmail: testEmail, db, openai })

  return { db, api, testEmail, ...dummyData }
}
