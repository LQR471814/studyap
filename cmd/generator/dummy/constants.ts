import { subject, unit } from "@/lib/schema/schema"
import { memo } from "@/lib/utils"
import type { DB } from "@/lib/db"
import type { LLMCache } from "@/lib/llm-cache/cache"

export type Context = {
  llm: LLMCache
  db: DB
}

export const VERSION = 1

export const generateSubject = memo(async (ctx: Context) => {
  const [SUBJECT] = await ctx.db
    .insert(subject)
    .values({
      name: "AP US History",
      version: VERSION,
    })
    .returning()

  return SUBJECT
})

export const generateUnits = memo(async (ctx: Context) => {
  const SUBJECT = await generateSubject(ctx)

  return ctx.db
    .insert(unit)
    .values(
      [
        "Period 1: 1491-1607",
        "Period 2: 1607-1754",
        "Period 3: 1754-1800",
        "Period 4: 1800-1848",
        "Period 5: 1844-1877",
        "Period 6: 1865-1898",
        "Period 7: 1890-1945",
        "Period 8: 1945-1980",
        "Period 9: 1980-Present",
      ].map((u) => ({
        name: u,
        subjectId: SUBJECT.id,
        version: VERSION,
      })),
    )
    .returning()
})
