import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql"
import * as testRels from "@/schema/tests.relations"
import * as tests from "@/schema/tests"
import { Client } from "@libsql/client"

export type DB = LibSQLDatabase<typeof testRels & typeof tests>

export function createDB(client: Client): DB {
  return drizzle(client, { schema: { ...tests, ...testRels } })
}

