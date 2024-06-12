import {
  question,
  questionUnit,
} from "@/lib/schema/schema"
import { memo } from "@/lib/utils"
import { type Context, generateSubject, generateUnits, VERSION } from "./constants"
import { generateStimuli } from "./stimuli"

type Question = {
  question: string
  guidelines: string
  totalPoints: number
  unitId: number
  stimulusId: number
}

export const generateFrqs = memo(async (ctx: Context) => {
  const SUBJECT = await generateSubject(ctx)
  const UNITS = await generateUnits(ctx)
  const STIMULI = await generateStimuli(ctx)

  const { db } = ctx

  const generatedQuestions: Question[] = [
    {
      question:
        "Briefly describe ONE perspective about women’s rights expressed in the image.",
      guidelines: `- 1 pt. for mentioning the emergence of a political party
- 1 pt. for mentioning increased political participation due to picketing and the political party`,
      totalPoints: 2,
      unitId: UNITS[6].id,
      stimulusId: STIMULI[4].id,
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
          subjectId: SUBJECT.id,
          version: VERSION,
          guidelines: q.guidelines,
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

  return generatedQuestions
})
