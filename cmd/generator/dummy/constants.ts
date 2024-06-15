import type { DB } from "@/lib/db"
import { subject, unit } from "@/lib/schema/schema"
import { createFnSpanner } from "@/lib/telemetry/utils"
import { memo } from "@/lib/utils"
import type { Span } from "@opentelemetry/api"

export const fnSpan = createFnSpanner("dummy")

export type Context = {
  db: DB
}

export const VERSION = 1

export const subjects = memo(
  async (span: Span | undefined, ctx: Context) => {
    return fnSpan(span, "subjects", async (span) => {
      const [subjectRow] = await ctx.db
        .insert(subject)
        .values({
          name: "AP US History",
          version: VERSION,
        })
        .returning()

      span.addEvent("insert subject", {
        "custom.result": JSON.stringify(subjectRow),
      })

      return subjectRow
    })
  },
  { 1: true },
)

export const units = memo(
  async (span: Span | undefined, ctx: Context) => {
    return fnSpan(span, "units", async (span) => {
      const subjectRow = await subjects(span, ctx)
      const result = await ctx.db
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
            subjectId: subjectRow.id,
            version: VERSION,
          })),
        )
        .returning()

      span.addEvent("create unit rows", {
        "custom.result": JSON.stringify(result),
      })

      return result
    })
  },
  { 1: true },
)
