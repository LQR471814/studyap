import { user } from "@/lib/schema/schema"
import { t } from "./trpc"
import { testsRouter } from "./tests"
import { eq } from "drizzle-orm"

export const masterRouter = t.router({
  profile: t.procedure.query(async ({ ctx: { db, userEmail } }) => {
    await db.insert(user).values({ email: userEmail }).onConflictDoNothing()
    const [profile] = await db
      .select()
      .from(user)
      .where(eq(user.email, userEmail))
    return profile
  }),
  tests: testsRouter,
})
export type Router = typeof masterRouter
