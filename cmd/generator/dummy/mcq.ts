import { question, questionChoice, questionUnit } from "@/lib/schema/schema"
import { type Context, generateSubject, generateUnits, VERSION } from "./constants"
import { generateStimuli } from "./stimuli"
import { memo } from "@/lib/utils"

type Question = {
  question: string
  choices: {
    text: string
    correct: boolean
    explanation: string
  }[]
  unitId: number
  stimulusId: number
}

export const generateMcqs = memo(async (ctx: Context) => {
  const SUBJECT = await generateSubject(ctx)
  const UNITS = await generateUnits(ctx)
  const STIMULI = await generateStimuli(ctx)

  const { db } = ctx

  const generatedQuestions: Question[] = [
    {
      question:
        "Based on this analysis, which of the following best describes the political and economic developments of the North and the South in the late eighteenth and early nineteenth centuries?",
      choices: [
        {
          text: "The North and the South cooperated politically and economically to develop a successful textile industry.",
          correct: false,
          explanation:
            "Industrial development primarily occurred in the North, and this development eventually led to the first industrial revolution in the United States.",
        },
        {
          text: "Both the North and the South depended upon legislation supporting slavery.",
          correct: false,
          explanation:
            "Only the Southern economy depended on the plantation system, which depended on slavery.",
        },
        {
          text: "The North and the South further separated because of rapid industrialization in the North and heavy dependence on agriculture in the South.",
          correct: true,
          explanation:
            "As the North developed industrially, the political land- scapes and economies of the North and the South further diverged.",
        },
        {
          text: "As the South began to develop industrially, it became politically and economically independent of the North.",
          correct: false,
          explanation:
            "Political and economic interaction and dependence still occurred, albeit to a lesser extent, between the North and the South.",
        },
      ],
      unitId: UNITS[4].id,
      stimulusId: STIMULI[0].id,
    },
    {
      question:
        "The cotton gin’s impact on society is analogous to the impact of all of the following innovations EXCEPT",
      choices: [
        {
          text: "the assembly line",
          correct: false,
          explanation:
            "Like the cotton gin, the introduction of the assembly line increased production in factories and allowed industrialization to develop more quickly.",
        },
        {
          text: "the telegraph",
          correct: true,
          explanation:
            "The introduction of the cotton gin increased the production of tangible (cotton) goods or outputs. The telegraph, on the other hand, had to do with abstract outputs such as increased communication.",
        },
        {
          text: "the sewing machine",
          correct: false,
          explanation:
            "Like the cotton gin, sewing machines enabled the process of making clothing to become faster and less expensive.",
        },
        {
          text: "the application of stream power to factories",
          correct: false,
          explanation:
            "Like the cotton gin, steam power was used to increase productivity in factories.",
        },
      ],
      unitId: UNITS[4].id,
      stimulusId: STIMULI[0].id,
    },
    {
      question: "This is a question without a stimulus.",
      choices: [
        {
          text: "The correct answer",
          correct: true,
          explanation: "By definition."
        },
        {
          text: "Incorrect answer A.",
          correct: false,
          explanation: "By definition."
        },
        {
          text: "Incorrect answer B.",
          correct: false,
          explanation: "By definition."
        },
        {
          text: "Incorrect answer C.",
          correct: false,
          explanation: "By definition."
        },
      ],
      unitId: UNITS[4].id,
      stimulusId: STIMULI[5].id,
    },
  ]

  const questionIds = (
    await db
      .insert(question)
      .values(
        generatedQuestions.map((q) => ({
          stimulusId: q.stimulusId,
          format: "mcq" as const,
          content: q.question,
          totalPoints: 1,
          subjectId: SUBJECT.id,
          version: VERSION,
        })),
      )
      .returning({ id: question.id })
  ).map((row, idx) => ({
    id: row.id,
    unitId: generatedQuestions[idx].unitId,
    choices: generatedQuestions[idx].choices,
  }))

  await db.insert(questionUnit).values(
    questionIds.map((q) => ({
      unitId: q.unitId,
      questionId: q.id,
    })),
  )

  await db.insert(questionChoice).values(
    questionIds.flatMap((q) =>
      q.choices.map((c) => ({
        questionId: q.id,
        choice: c.text,
        correct: c.correct,
        explanation: c.explanation,
      })),
    ),
  )

  return generatedQuestions
})
