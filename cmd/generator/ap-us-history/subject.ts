import { subject } from "@/lib/schema/schema"
import { ctx } from "../context"

const { db } = ctx

export const [SUBJECT] = await db
  .insert(subject)
  .values({
    name: "AP US History",
  })
  .returning()

