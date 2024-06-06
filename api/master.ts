import { user } from "@/lib/schema/schema"
import { t } from "./common"
import { testsRouter } from "./tests"

export const masterRouter = t.router({
  profile: t.procedure.query(async ({ ctx: { db } }) => {
    return await db.select().from(user)
  }),
  tests: testsRouter,
})
export type Router = typeof masterRouter

