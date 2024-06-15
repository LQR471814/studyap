import { fnSpan } from "@/api/tracer"
import type { DB } from "@/lib/db"
import type { LLMCache } from "@/lib/llm-cache/cache"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  Message,
} from "@/lib/llm/core"
import {
  question,
  questionChoice,
  questionUnit,
  stimulus,
  subject,
  unit,
} from "@/lib/schema/schema"
import { grabRandom, memo } from "@/lib/utils"
import { type Span, SpanStatusCode } from "@opentelemetry/api"
import { eq } from "drizzle-orm"
import seedrandom from "seedrandom"
import { z } from "zod"
import type { Config } from "./config"
import { FrqPrompts, McqPrompts, StimulusPrompts } from "./synthetic-prompts"

async function retryLLMCache<F extends FunctionDefs, R>(
  span: Span | undefined,
  llm: LLMCache,
  request: GenerateRequest<F>,
  response: (res: GenerateResult<F>) => Promise<R | undefined> | R | undefined,
): Promise<R> {
  return fnSpan(span, "retryLLMCache", async (span) => {
    for (let i = 0; i < 5; i++) {
      let result: GenerateResult<F>
      // try cached result at first, but then revalidate
      if (i === 0) {
        result = await llm.generate(span, request)
      } else {
        result = await llm.revalidate(span, request)
      }

      const res = await response(result)
      if (res === undefined) {
        // exponential back off
        await new Promise((r) => setTimeout(r, 2 ** i * 1000))
        continue
      }
      return res
    }

    if (span.isRecording()) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Failed 5 times in a row.",
      })
    }

    throw new Error("Failed 5 times to evaluate LLM request.")
  })
}

export class LLMGenerator {
  config: Config
  llm: LLMCache
  db: DB
  randThunk: () => number

  constructor(db: DB, llm: LLMCache, config: Config, seed?: string) {
    this.db = db
    this.llm = llm
    this.config = config
    this.randThunk = seedrandom(seed ?? "default")
  }

  private subject = memo(async (span: Span | undefined) => {
    return fnSpan(span, "subject", async (span) => {
      const existing = await this.db
        .select()
        .from(subject)
        .where(eq(subject.name, this.config.subjectName))
        .limit(1)
      if (existing.length > 0) {
        span.setStatus({
          code: SpanStatusCode.OK,
          message: "NO-OP: use existing subject",
        })

        return existing[0]
      }

      const [subjectRow] = await this.db
        .insert(subject)
        .values({
          name: this.config.subjectName,
          version: this.config.version,
        })
        .returning()

      if (span.isRecording()) {
        span.addEvent("insert returns", {
          result: JSON.stringify(subjectRow),
        })
        span.setStatus({
          code: SpanStatusCode.OK,
          message: "INSERTED: subjectRow",
        })
      }

      return subjectRow
    })
  })

  private units = memo(async (span: Span | undefined) => {
    return fnSpan(span, "units", async (span) => {
      const subjectRow = await this.subject(span)

      const existing = await this.db
        .select()
        .from(unit)
        .where(eq(unit.subjectId, subjectRow.id))
      if (existing.length > 0) {
        await this.db
          .delete(stimulus)
          .where(eq(stimulus.subjectId, subjectRow.id))

        if (span.isRecording()) {
          span.setStatus({
            code: SpanStatusCode.OK,
            message:
              "NO-OP: use existing units, deleting existing stimuli/questions",
          })
        }

        return existing
      }

      const unitRows = await this.db
        .insert(unit)
        .values(
          this.config.unitNames.map((u) => ({
            name: u,
            subjectId: subjectRow.id,
            version: this.config.version,
          })),
        )
        .returning({ id: unit.id, name: unit.name })

      if (span.isRecording()) {
        span.addEvent("insert unitRows returns", {
          result: JSON.stringify(unitRows),
        })
        span.setStatus({
          code: SpanStatusCode.OK,
          message: "INSERTED: unitRows",
        })
      }

      return unitRows
    })
  })

  private stimuli = memo(async (span: Span | undefined) => {
    return fnSpan(span, "stimuli", async (span) => {
      if (span.isRecording()) {
        span.setAttribute(
          "descriptions.text",
          this.config.stimuli.descriptions.text,
        )
        span.setAttribute(
          "descriptions.attribution",
          this.config.stimuli.descriptions.attribution,
        )
      }

      const stimulusObj = z.object({
        text: z.string().describe(this.config.stimuli.descriptions.text),
        attribution: z
          .string()
          .describe(this.config.stimuli.descriptions.attribution),
        image: z
          .boolean()
          .describe(
            "This should be set to TRUE if the 'text' field describes an image.",
          ),
      })

      const stimulusIterable = (
        span: Span | undefined,
        units: typeof unitRows,
      ): { next(): Promise<z.TypeOf<typeof stimulusObj>> } => {
        const messages: Message[] = [
          {
            role: "user",
            content: StimulusPrompts.instructions(units.map((u) => u.name)),
          },
        ]

        const askLLM = () =>
          retryLLMCache(
            span,
            this.llm,
            {
              model: "big",
              systemText: this.config.stimuli.systemText,
              messages,
              mustUseFunctions: true,
              functions: {
                generate_stimulus: {
                  description: `Create a stimulus for the ${this.config.subjectName} exam.`,
                  returns: stimulusObj,
                },
              },
            },
            (res) => {
              const completion = res.returns?.generate_stimulus
              if (!completion) {
                return
              }
              return completion
            },
          )

        return {
          next() {
            if (messages.length > 2) {
              messages.push({
                role: "user",
                content: StimulusPrompts.continuation(units.map((u) => u.name)),
              })
            }
            return askLLM()
          },
        }
      }

      const subjectRow = await this.subject(span)
      const unitRows = await this.units(span)

      const generatedStimuli: {
        value: z.TypeOf<typeof stimulusObj>
        units: typeof unitRows
      }[] = []

      console.log("BEGIN STIMULI...")

      await Promise.all(
        unitRows.map((unit) => {
          return fnSpan(span, "generateStimuliForUnit", async (span) => {
            if (span.isRecording()) {
              span.setAttribute("unitName", unit.name)
              span.setAttribute("unitId", unit.id)
            }

            let generator = stimulusIterable(span, [unit])
            for (let i = 0; i < this.config.stimuli.stimuliPerUnit; i++) {
              if (span.isRecording()) {
                span.addEvent("generating stimulus", { number: i + 1 })
              }

              const value = await generator.next()
              generatedStimuli.push({ value, units: [unit] })
            }
          })
        }),
      )

      console.log("BEGIN DOUBLE-UNIT STIMULI...")

      await Promise.all(
        new Array(this.config.stimuli.doubleUnitCount)
          .fill(undefined)
          .map(() => {
            return fnSpan(span, "generateDoubleUnit", async (span) => {
              const units = grabRandom(this.randThunk, unitRows, 2)

              if (span.isRecording()) {
                span.setAttribute("units", JSON.stringify(units))
              }

              const result = await stimulusIterable(span, units).next()
              generatedStimuli.push({ value: result, units })
            })
          }),
      )

      console.log("BEGIN TRIPLE-UNIT STIMULI...")

      await Promise.all(
        new Array(this.config.stimuli.tripleUnitCount)
          .fill(undefined)
          .map(async () => {
            return fnSpan(span, "generateTripleUnit", async (span) => {
              const units = grabRandom(this.randThunk, unitRows, 3)

              if (span.isRecording()) {
                span.setAttribute("units", JSON.stringify(units))
              }

              const result = await stimulusIterable(span, units).next()
              generatedStimuli.push({ value: result, units })
            })
          }),
      )

      const stimuliRows = (
        await this.db
          .insert(stimulus)
          .values(
            generatedStimuli.map((s) => ({
              content: s.value.text,
              attribution: s.value.attribution,
              subjectId: subjectRow.id,
              version: this.config.version,
            })),
          )
          .returning({ id: stimulus.id, content: stimulus.content })
      ).map((row, idx) => ({
        ...row,
        units: generatedStimuli[idx].units,
      }))

      span.addEvent("all stimuli generated", { count: stimuliRows.length })
      console.log("COMPLETE STIMULI", "generated:", stimuliRows.length)

      const midpoint = Math.floor(stimuliRows.length / 2)
      return {
        mcqs: stimuliRows.slice(0, midpoint),
        frqs: stimuliRows.slice(midpoint, stimuliRows.length),
      }
    })
  })

  private mcqs = memo(async (span: Span | undefined) => {
    return fnSpan(span, "mcqs", async (span) => {
      const subjectRow = await this.subject(span)
      const stimuliRows = await this.stimuli(span)

      if (span.isRecording()) {
        span.setAttribute(
          "descriptions.question",
          this.config.mcqs.descriptions.question ?? "undefined",
        )
      }

      const answerChoice = z.object({
        text: z
          .string()
          .describe(
            "A plain text potential answer pertaining to the multiple choice question.",
          ),
        correct: z
          .boolean()
          .describe(
            "A boolean that is true if this answer choice is the correct or one of the correct answer choices.",
          ),
        explanation: z
          .string()
          .describe(
            "An explanation explaining why this answer is correct or incorrect as indicated by the 'correct' field.",
          ),
      })

      const questionObj = z.object({
        question: z
          .string()
          .describe(
            this.config.mcqs.descriptions.question ??
              "The plain text question content of the multiple choice question.",
          ),
        choiceA: answerChoice.describe(
          "Answer choice A, this should be an object.",
        ),
        choiceB: answerChoice.describe(
          "Answer choice B, this should be an object.",
        ),
        choiceC: answerChoice.describe(
          "Answer choice C, this should be an object.",
        ),
        choiceD: answerChoice.describe(
          "Answer choice D, this should be an object.",
        ),
        choiceE: answerChoice
          .describe(
            "Answer choice E, if necessary, this should be an object if defined.",
          )
          .nullish(),
      })

      const questionIterable = (
        span: Span | undefined,
        stimulus: (typeof stimuliRows)["mcqs"][number],
        answerCount: number,
      ) => {
        const unitNames = stimulus.units.map((u) => u.name)

        const messages: Message[] = [
          {
            role: "user",
            content: McqPrompts.instructions(
              this.config.subjectName,
              unitNames,
              stimulus.content,
              answerCount,
            ),
          },
        ]

        const askLLM = () =>
          fnSpan(span, "askLLM", (span) =>
            retryLLMCache(
              span,
              this.llm,
              {
                model: "big",
                messages: messages,
                systemText: this.config.mcqs.systemText,
                mustUseFunctions: true,
                functions: {
                  generate_mcq: {
                    description: `Create a multiple choice question for the ${this.config.subjectName} exam.`,
                    returns: questionObj,
                  },
                },
              },
              (res) => {
                const completion = res.returns?.generate_mcq
                if (!completion) {
                  if (span.isRecording()) {
                    span.addEvent("got empty completion!", {
                      "log.severity": "WARN",
                      completion: JSON.stringify(res),
                    })
                  }
                  return
                }

                const choices = [
                  completion.choiceA,
                  completion.choiceB,
                  completion.choiceC,
                  completion.choiceD,
                  ...(completion.choiceE ? [completion.choiceE] : []),
                ]

                const correct = choices.find((c) => c.correct)
                if (!correct) {
                  if (span.isRecording()) {
                    span.addEvent(
                      "no correct choice present in generated mcq.",
                      {
                        "log.severity": "WARN",
                        completion: JSON.stringify(completion),
                      },
                    )
                  }
                  return
                }

                messages.push({
                  role: "assistant",
                  content: JSON.stringify(completion),
                })
                return {
                  question: completion.question,
                  choices,
                }
              },
            ),
          )

        const subjectName = this.config.subjectName

        return {
          next() {
            if (messages.length > 2) {
              messages.push({
                role: "user",
                content: McqPrompts.continuation(
                  subjectName,
                  unitNames,
                  answerCount,
                ),
              })
            }
            return askLLM()
          },
        }
      }

      const generatedQuestions: {
        value: {
          question: string
          choices: {
            text: string
            correct: boolean
            explanation: string
          }[]
        }
        stimulus: (typeof stimuliRows)["mcqs"][number]
      }[] = []

      console.log("BEGIN MCQs...")

      await Promise.all(
        stimuliRows.mcqs.map((stimulus) => {
          return fnSpan(span, "generateMcqForStimulus", async (span) => {
            if (span.isRecording()) {
              span.setAttribute("stimulus", JSON.stringify(stimulus))
            }

            const generator = questionIterable(span, stimulus, 1)
            for (let i = 0; i < this.config.mcqs.questionsPerStimulus; i++) {
              const value = await generator.next()
              generatedQuestions.push({ value, stimulus })
            }
          })
        }),
      )

      const randomStimuli = grabRandom(
        this.randThunk,
        stimuliRows.mcqs,
        this.config.mcqs.doubleAnswerCount,
      )
      await Promise.all(
        randomStimuli.map((stimulus) => {
          return fnSpan(span, "generateMcqForRandomStimulus", async (span) => {
            if (span.isRecording()) {
              span.setAttribute("stimulus", JSON.stringify(stimulus))
            }

            const generator = questionIterable(span, stimulus, 2)
            const value = await generator.next()
            generatedQuestions.push({ value, stimulus })
          })
        }),
      )

      if (generatedQuestions.length === 0) {
        return []
      }

      const questionIds = (
        await this.db
          .insert(question)
          .values(
            generatedQuestions.map((q) => ({
              stimulusId: q.stimulus.id,
              format: "mcq" as const,
              content: q.value.question,
              totalPoints: 1,
              subjectId: subjectRow.id,
              version: this.config.version,
            })),
          )
          .returning({ id: question.id })
      ).map((row, idx) => ({
        id: row.id,
        stimulus: generatedQuestions[idx].stimulus,
        choices: generatedQuestions[idx].value.choices,
      }))

      await this.db.insert(questionUnit).values(
        questionIds.flatMap((q) =>
          q.stimulus.units.map((unit) => ({
            unitId: unit.id,
            questionId: q.id,
          })),
        ),
      )

      await this.db.insert(questionChoice).values(
        questionIds.flatMap((q) =>
          q.choices.map((c) => ({
            questionId: q.id,
            choice: c.text,
            correct: c.correct,
            explanation: c.explanation,
          })),
        ),
      )

      span.addEvent("complete mcq", { count: generatedQuestions.length })
      console.log("COMPLETE MCQ")

      return generatedQuestions
    })
  })

  private frqs = memo(async (span: Span | undefined) => {
    return fnSpan(span, "frqs", async (span) => {
      const subjectRow = await this.subject(span)
      const stimuliRows = await this.stimuli(span)

      if (span.isRecording()) {
        span.setAttribute(
          "descriptions.question",
          this.config.frqs.descriptions.question ?? "undefined",
        )
        span.setAttribute(
          "descriptions.guidelines",
          this.config.frqs.descriptions.guidelines ?? "undefined",
        )
        span.setAttribute(
          "descriptions.totalPoints",
          this.config.frqs.descriptions.totalPoints ?? "undefined",
        )
      }

      const questionObj = z.object({
        question: z
          .string()
          .describe(
            this.config.frqs.descriptions.question ??
              "The plain text question content of the free response question.",
          ),
        guidelines: z
          .string()
          .describe(
            this.config.frqs.descriptions.guidelines ??
              "Grading guidelines to be given to a grader on how they should score an arbitrary student response to the question.",
          ),
        totalPoints: z
          .number()
          .describe(
            this.config.frqs.descriptions.totalPoints ??
              "The total amount of points a student can earn on this question, as specified by the 'guidelines' key.",
          ),
      })

      const questionIterable = (
        span: Span | undefined,
        stimulus: (typeof stimuliRows)["mcqs"][number],
      ): { next(): Promise<z.TypeOf<typeof questionObj>> } => {
        const unitNames = stimulus.units.map((u) => u.name)

        const messages: Message[] = [
          {
            role: "user",
            content: FrqPrompts.instructions(
              this.config.subjectName,
              unitNames,
              stimulus.content,
            ),
          },
        ]

        const askLLM = () =>
          fnSpan(span, "askLLM", (span) =>
            retryLLMCache(
              span,
              this.llm,
              {
                model: "big",
                messages: messages,
                systemText: this.config.frqs.systemText,
                mustUseFunctions: true,
                functions: {
                  generate_frq: {
                    description: `Create a free response question for the ${this.config.subjectName} exam.`,
                    returns: questionObj,
                  },
                },
              },
              (res) => {
                const completion = res.returns?.generate_frq
                if (!completion) {
                  if (span.isRecording()) {
                    span.addEvent("got empty completion!", {
                      "log.severity": "WARN",
                      completion: JSON.stringify(res),
                    })
                  }
                  return
                }

                messages.push({
                  role: "assistant",
                  content: JSON.stringify(completion),
                })
                return completion
              },
            ),
          )

        const subjectName = this.config.subjectName
        return {
          async next() {
            if (messages.length > 2) {
              messages.push({
                role: "user",
                content: FrqPrompts.continuation(subjectName, unitNames),
              })
            }
            return askLLM()
          },
        }
      }

      const generatedQuestions: {
        value: z.TypeOf<typeof questionObj>
        stimulus: (typeof stimuliRows)["mcqs"][number]
      }[] = []

      console.log("BEGIN FRQs...")

      await Promise.all(
        stimuliRows.frqs.map((stimulus) => {
          return fnSpan(span, "generateFrqForStimulus", async (span) => {
            if (span.isRecording()) {
              span.setAttribute("stimulus", JSON.stringify(stimulus))
            }

            const generator = questionIterable(span, stimulus)
            for (let i = 0; i < this.config.frqs.questionsPerStimulus; i++) {
              const value = await generator.next()
              generatedQuestions.push({ value, stimulus })
            }
          })
        }),
      )

      if (generatedQuestions.length === 0) {
        return []
      }

      const questionIds = await this.db
        .insert(question)
        .values(
          generatedQuestions.map((q) => ({
            format: "frq" as const,
            content: q.value.question,
            totalPoints: q.value.totalPoints,
            subjectId: subjectRow.id,
            version: this.config.version,
            gradingGuidelines: q.value.guidelines,
            stimulusId: q.stimulus.id,
          })),
        )
        .returning({ id: question.id })

      await this.db.insert(questionUnit).values(
        questionIds.flatMap((q, idx) =>
          generatedQuestions[idx].stimulus.units.map((unit) => ({
            unitId: unit.id,
            questionId: q.id,
          })),
        ),
      )

      span.addEvent("complete frq generation", {
        count: generatedQuestions.length,
      })

      console.log("COMPLETE FRQ")

      return generatedQuestions
    })
  })

  async generate(span: Span | undefined) {
    return fnSpan(span, "generate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("config", JSON.stringify(this.config))
      }

      const subject = await this.subject(span)
      const units = await this.units(span)
      const stimuli = await this.stimuli(span)
      const mcqs = await this.mcqs(span)
      const frqs = await this.frqs(span)

      return { subject, units, stimuli, mcqs, frqs }
    })
  }
}
