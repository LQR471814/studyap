import type { DB } from "@/lib/db"
import {
  question,
  questionChoice,
  questionUnit,
  stimulus,
  stimulusUnit,
  subject,
  unit,
} from "@/lib/schema/schema"

export type Stimulus = {
  unitIds: number[]
  content: string
  attribution: string
}

export type McqChoice = {
  text: string
  correct: boolean
  explanation: string
}
export type Mcq = {
  stimulusId: number
  unitIds: number[]
  question: string
  choices: McqChoice[]
}

export type Frq = {
  stimulusId: number
  unitIds: number[]
  question: string
  gradingGuidelines: string
  totalPoints: number
}

export class Append {
  db: DB
  subjectName: string
  unitNames: string[]
  version: number

  private stimuli: Stimulus[]
  private mcqs: Mcq[]
  private frqs: Frq[]

  constructor(
    db: DB,
    subjectName: string,
    unitNames: string[],
    version: number,
  ) {
    this.db = db
    this.subjectName = subjectName
    this.unitNames = unitNames
    this.version = version

    this.stimuli = []
    this.mcqs = []
    this.frqs = []
  }

  stimulus(input: Stimulus) {
    this.stimuli.push(input)
  }
  mcq(input: Mcq) {
    this.mcqs.push(input)
  }
  frq(input: Frq) {
    this.frqs.push(input)
  }

  async execute() {
    await this.db.transaction(async (tx) => {
      const [{ id: subjectId }] = await tx
        .insert(subject)
        .values({
          name: this.subjectName,
          version: this.version,
        })
        .onConflictDoUpdate({
          set: {
            version: this.version,
          },
          target: subject.name,
        })
        .returning()

      await tx
        .insert(unit)
        .values(
          this.unitNames.map((unitName) => ({
            subjectId,
            version: this.version,
            name: unitName,
          })),
        )
        .onConflictDoNothing()

      if (this.stimuli.length > 0) {
        const stimulusIds = await tx
          .insert(stimulus)
          .values(
            this.stimuli.map((s) => ({
              content: s.content,
              attribution: s.attribution,
              version: this.version,
              subjectId,
            })),
          )
          .returning({ id: stimulus.id })

        await tx.insert(stimulusUnit).values(
          stimulusIds.flatMap(({ id }, i) =>
            this.stimuli[i].unitIds.map((unitId) => ({
              stimulusId: id,
              unitId: unitId,
            })),
          ),
        )
      }

      if (this.mcqs.length > 0) {
        const questionIds = await tx
          .insert(question)
          .values(
            this.mcqs.map((m) => ({
              version: this.version,
              stimulusId: m.stimulusId,
              subjectId,
              format: "mcq" as const,
              content: m.question,
              totalPoints: 1,
            })),
          )
          .returning({ id: question.id })

        await tx.insert(questionChoice).values(
          this.mcqs.flatMap((m) =>
            m.choices.map((c, i) => ({
              questionId: questionIds[i].id,
              choice: c.text,
              correct: c.correct,
              explanation: c.explanation,
            })),
          ),
        )

        await tx.insert(questionUnit).values(
          questionIds.flatMap(({ id }, i) =>
            this.mcqs[i].unitIds.map((unitId) => ({
              unitId,
              questionId: id,
            })),
          ),
        )
      }

      if (this.frqs.length > 0) {
        const questionIds = await tx
          .insert(question)
          .values(
            this.frqs.map((m) => ({
              version: this.version,
              stimulusId: m.stimulusId,
              subjectId,
              format: "frq" as const,
              content: m.question,
              totalPoints: 1,
            })),
          )
          .returning({ id: question.id })

        await tx.insert(questionUnit).values(
          questionIds.flatMap(({ id }, i) =>
            this.frqs[i].unitIds.map((unitId) => ({
              unitId,
              questionId: id,
            })),
          ),
        )
      }
    })

    this.stimuli = []
    this.mcqs = []
    this.frqs = []
  }
}
