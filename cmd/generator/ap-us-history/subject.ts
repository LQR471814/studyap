import { subject } from "@/lib/schema/schema"
import type { Context } from "../context"
import { memo } from "@/lib/utils"

export const generateSubject = memo(async (ctx: Context) => {
  const [SUBJECT] = await ctx.db
    .insert(subject)
    .values({
      name: "AP US History",
    })
    .returning()

  return SUBJECT
})
