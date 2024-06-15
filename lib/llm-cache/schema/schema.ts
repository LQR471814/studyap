import { sqliteTable, text } from "drizzle-orm/sqlite-core"

const CASCADE = {
  onDelete: "cascade",
  onUpdate: "cascade",
} as const

export const completion = sqliteTable("completion", {
  // it is up to the API consumer to pick an id for the request
  id: text("id").notNull().primaryKey(),
  text: text("text").notNull(),
})

export const completionFunctionCall = sqliteTable("completionFunctionCall", {
  completionId: text("completionId")
    .notNull()
    .references(() => completion.id, CASCADE),
  functionName: text("functionName").notNull(),
  /**
   * This should be in JSON format.
   */
  result: text("result").notNull(),
})
