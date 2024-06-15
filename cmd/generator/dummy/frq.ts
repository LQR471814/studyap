import { question, questionUnit } from "@/lib/schema/schema"
import { memo } from "@/lib/utils"
import type { Span } from "@opentelemetry/api"
import { type Context, VERSION, fnSpan, subjects, units } from "./constants"
import { stimuli } from "./stimuli"

type Question = {
  question: string
  guidelines: string
  totalPoints: number
  unitId: number
  stimulusId: number
}

export const frqs = memo(
  async (span: Span | undefined, ctx: Context) => {
    return fnSpan(span, "frqs", async (span) => {
      const subjectRow = await subjects(span, ctx)
      const unitRows = await units(span, ctx)
      const stimuliRows = await stimuli(span, ctx)

      const { db } = ctx

      const generatedQuestions: Question[] = [
        {
          question:
            "Briefly describe ONE perspective about women’s rights expressed in the image.",
          guidelines: `- 1 pt. for mentioning the emergence of a political party
- 1 pt. for mentioning increased political participation due to picketing and the political party`,
          totalPoints: 2,
          unitId: unitRows[6].id,
          stimulusId: stimuliRows[4].id,
        },
      ]

      const questionIds = (
        await db
          .insert(question)
          .values(
            generatedQuestions.map((q) => ({
              stimulusId: q.stimulusId,
              format: "frq" as const,
              content: q.question,
              totalPoints: 1,
              subjectId: subjectRow.id,
              version: VERSION,
              gradingGuidelines: q.guidelines,
            })),
          )
          .returning({ id: question.id })
      ).map((row, idx) => ({
        id: row.id,
        unitId: generatedQuestions[idx].unitId,
        guidelines: generatedQuestions[idx].guidelines,
      }))

      await db.insert(questionUnit).values(
        questionIds.map((q) => ({
          unitId: q.unitId,
          questionId: q.id,
        })),
      )

      span.addEvent("questionIds", {
        "custom.questionIds": JSON.stringify(questionIds),
      })

      return generatedQuestions
    })
  },
  { 1: true },
)
