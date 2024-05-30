import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql"
import * as schemaRels from "@/lib/schema/schema.relations"
import * as schema from "@/lib/schema/schema"
import { Client } from "@libsql/client"

export type DB = LibSQLDatabase<typeof schemaRels & typeof schema>

export function createDB(client: Client): DB {
  return drizzle(client, { schema: { ...schema, ...schemaRels } })
}

