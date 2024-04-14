import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as testRels from "@/schema/tests.relations"
import * as tests from "@/schema/tests"

const client = createClient({
    url: process.env.DATABASE_URL ?? "file:database.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, {
    schema: {
        ...testRels,
        ...tests,
    }
})

