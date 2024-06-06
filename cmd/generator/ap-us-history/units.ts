import { unit } from "@/lib/schema/schema"
import { SUBJECT } from "./subject"
import { ctx } from "../context"

const { db } = ctx

export const UNITS = await db
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
    })),
  )
  .returning()
