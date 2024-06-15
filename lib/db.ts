import * as schema from "@/lib/schema/schema"
import * as schemaRels from "@/lib/schema/schema.relations"
import type { Client } from "@libsql/client"
import { type LibSQLDatabase, drizzle } from "drizzle-orm/libsql"

export type DB = LibSQLDatabase<typeof schemaRels & typeof schema>

export function createDB(client: Client): DB {
  return drizzle(client, { schema: { ...schema, ...schemaRels } })
}
