import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  question,
  questionChoice,
  questionUnit,
  stimulus,
  subject,
  testAttempt,
  unit,
} from "@/lib/schema/schema"
import { and, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm"
import { z } from "zod"
import { t } from "./common"
import zodToJsonSchema from "zod-to-json-schema"
import { retryAsyncFn } from "@/lib/utils"

export const createTestOptions = z.object({
  subject: z.number(),
  units: z.array(z.number()).optional(),
  mcqCount: z.number(),
  frqCount: z.number(),
})
export type CreateTestOptions = z.TypeOf<typeof createTestOptions>

export type MCQ = {
  id: number
  question: string
}

export type FRQ = {
  id: number
  question: string
}

export type Stimulus = {
  id: number
  content: string | null
  mcqs: MCQ[]
  frqs: FRQ[]
}

export type TestAttempt = {
  id: number
  subjectId: number
  subjectName: string
  stimuli: Record<number, Stimulus>
  mcqs: MCQ[]
  frqs: FRQ[]
}

export async function getAvailableQuestionCount(
  userEmail: string,
  db: DB,
  subjectId: number,
  units?: number[],
) {
  // gets all the mcqIds which already have a corresponding mcqAttempt for userEmail
  const hasMcqAttemptByUser = db
    .select({ questionId: mcqAttempt.questionId })
    .from(mcqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, mcqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasMcqAttemptByUser")

  // gets all the mcqs that are not joined with hasMcqAttempt,
  // that is, all the mcqs that aren't attempted by this user yet
  const mcqs = await db
    .select({
      count: sql<number>`count(distinct ${question.id})`.mapWith(Number),
    })
    .from(question)
    .leftJoin(
      hasMcqAttemptByUser,
      eq(question.id, hasMcqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasMcqAttemptByUser.questionId),
        eq(question.subjectId, subjectId),
        eq(question.format, "mcq"),
        units && units.length > 0
          ? inArray(questionUnit.unitId, units)
          : undefined,
      ),
    )

  const hasFrqAttemptByUser = db
    .select({ questionId: frqAttempt.questionId })
    .from(frqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, frqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasFrqAttemptByUser")

  const frqs = await db
    .select({
      count: sql<number>`count(distinct ${question.id})`.mapWith(Number),
    })
    .from(question)
    .leftJoin(
      hasFrqAttemptByUser,
      eq(question.id, hasFrqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasFrqAttemptByUser.questionId),
        eq(question.subjectId, subjectId),
        eq(question.format, "frq"),
        units && units.length > 0
          ? inArray(questionUnit.unitId, units)
          : undefined,
      ),
    )

  return { frqs: frqs[0].count, mcqs: mcqs[0].count }
}

export async function createTest(
  userEmail: string,
  db: DB,
  options: CreateTestOptions,
): Promise<number | Error> {
  if (options.mcqCount === 0 && options.frqCount === 0) {
    throw new Error("You cannot create a empty test.")
  }

  // gets all the mcqIds which already have a corresponding mcqAttempt for userEmail
  const hasMcqAttemptByUser = db
    .select({ questionId: mcqAttempt.questionId })
    .from(mcqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, mcqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasMcqAttemptByUser")

  // gets all the mcqs that are not joined with hasMcqAttempt,
  // that is, all the mcqs that aren't attempted by this user yet
  const mcqs = await db
    .select({
      stimulusId: question.stimulusId,
      id: question.id,
      question: question.content,
    })
    .from(question)
    .leftJoin(
      hasMcqAttemptByUser,
      eq(question.id, hasMcqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasMcqAttemptByUser.questionId),
        eq(question.subjectId, options.subject),
        eq(question.format, "mcq"),
        options.units && options.units.length > 0
          ? inArray(questionUnit.unitId, options.units)
          : undefined,
      ),
    )
    .groupBy(question.id)
    // for some reason .limit() will ignore mcqCount if it is 0
    .limit(options.mcqCount === 0 ? 1 : options.mcqCount)

  if (mcqs.length < options.mcqCount) {
    return new Error(
      `There are not enough MCQ questions you haven't already attempted to create a test with ${options.mcqCount} mcq questions. (only ${mcqs.length} questions are currently available)`,
    )
  }

  const hasFrqAttemptByUser = db
    .select({ questionId: frqAttempt.questionId })
    .from(frqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, frqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasFrqAttemptByUser")

  const frqs = await db
    .select({
      id: question.id,
      stimulusId: question.stimulusId,
      question: question.content,
    })
    .from(question)
    .leftJoin(
      hasFrqAttemptByUser,
      eq(question.id, hasFrqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasFrqAttemptByUser.questionId),
        eq(question.subjectId, options.subject),
        eq(question.format, "frq"),
        options.units && options.units.length > 0
          ? inArray(questionUnit.unitId, options.units)
          : undefined,
      ),
    )
    .groupBy(question.id)
    // for some reason .limit() will ignore frqCount if it is 0
    .limit(options.frqCount === 0 ? 1 : options.frqCount)

  if (frqs.length < options.frqCount) {
    return new Error(
      `There are not enough FRQ questions you haven't already attempted to create a test with ${options.frqCount} frq questions. (only ${frqs.length} questions are currently available)`,
    )
  }

  return await db.transaction(async (tx) => {
    const [attempt] = await tx
      .insert(testAttempt)
      .values({ userEmail, subjectId: options.subject })
      .returning()

    if (options.mcqCount > 0) {
      await tx.insert(mcqAttempt).values(
        mcqs.map((q) => ({
          testId: attempt.id,
          questionId: q.id,
        })),
      )
    }
    if (options.frqCount > 0) {
      await tx.insert(frqAttempt).values(
        frqs.map((q) => ({
          testId: attempt.id,
          questionId: q.id,
        })),
      )
    }

    return attempt.id
  })
}

export const testsRouter = t.router({
  listSubjects: t.procedure.query(({ ctx: { db } }) => {
    return db.select().from(subject)
  }),
  listUnits: t.procedure
    .input(z.number().describe("subject.id"))
    .query(({ ctx: { db }, input }) => {
      return db
        .select({ id: unit.id, name: unit.name })
        .from(subject)
        .where(eq(subject.id, input))
        .innerJoin(unit, eq(unit.subjectId, subject.id))
    }),
  getAvailableQuestions: t.procedure
    .input(
      z.object({
        subjectId: z.number(),
        unitIds: z.number().array().optional(),
      }),
    )
    .query(async ({ ctx: { db, userEmail }, input }) => {
      return getAvailableQuestionCount(
        userEmail,
        db,
        input.subjectId,
        input.unitIds,
      )
    }),
  createTest: t.procedure
    .input(createTestOptions)
    .mutation(async ({ ctx: { db, userEmail }, input }) => {
      const res = await createTest(userEmail, db, input)
      if (res instanceof Error) {
        throw res
      }
      return res
    }),
  deleteTest: t.procedure
    .input(z.number().describe("test.id"))
    .query(({ ctx: { db }, input }) => {
      return db.delete(testAttempt).where(eq(testAttempt.id, input))
    }),
  fillMCQs: t.procedure
    .input(
      z.object({
        testAttemptId: z.number(),
        questions: z
          .object({
            questionId: z.number(),
            questionChoiceId: z.number(),
          })
          .array(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      await db.insert(mcqAttempt).values(
        input.questions.map((r) => ({
          testId: input.testAttemptId,
          questionId: r.questionId,
          response: r.questionChoiceId,
        })),
      )
    }),
  evalMCQs: t.procedure
    .input(z.number().array().describe("list of question.ids"))
    .mutation(async ({ ctx: { db }, input }) => {
      const responded = db
        .select({
          questionId: mcqAttempt.questionId,
          testId: mcqAttempt.testId,
        })
        .from(mcqAttempt)
        .where(
          and(
            inArray(mcqAttempt.questionId, input),
            isNull(mcqAttempt.scoredPoints),
            isNotNull(mcqAttempt.response),
          ),
        )

      // mcqAttempts that ended up correct
      const correctAttempts = await responded.innerJoin(
        questionChoice,
        and(
          eq(questionChoice.id, mcqAttempt.response),
          eq(questionChoice.correct, true),
        ),
      )

      await db
        .update(mcqAttempt)
        .set({ scoredPoints: 1 })
        .where(
          or(
            ...correctAttempts.map((a) =>
              and(
                eq(mcqAttempt.questionId, a.questionId),
                eq(mcqAttempt.testId, a.testId),
              ),
            ),
          ),
        )

      // mcqAttempts that ended up incorrect
      const incorrectAttempts = await responded.innerJoin(
        questionChoice,
        and(
          eq(questionChoice.id, mcqAttempt.response),
          eq(questionChoice.correct, false),
        ),
      )

      await db
        .update(mcqAttempt)
        .set({ scoredPoints: 0 })
        .where(
          or(
            ...incorrectAttempts.map((a) =>
              and(
                eq(mcqAttempt.questionId, a.questionId),
                eq(mcqAttempt.testId, a.testId),
              ),
            ),
          ),
        )
    }),
  fillFRQs: t.procedure
    .input(
      z
        .object({
          questionId: z.number(),
          contents: z.string(),
        })
        .array(),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      await db.transaction((tx) => {
        return Promise.all(
          input.map((c) => {
            return tx
              .update(frqAttempt)
              .set({ response: c.contents })
              .where(eq(frqAttempt.questionId, c.questionId))
          }),
        )
      })
    }),
  evalFRQs: t.procedure
    .input(z.number().array().describe("list of frqAttempt.ids"))
    .mutation(async ({ ctx: { db, openai }, input }) => {
      const responded = await db
        .select({
          questionId: frqAttempt.questionId,
          testId: frqAttempt.testId,
          response: frqAttempt.response,
          question: question.content,
          stimulus: stimulus.content,
          attribution: stimulus.attribution,
          imageAltText: stimulus.imageAltText,
        })
        .from(frqAttempt)
        .where(
          and(
            inArray(frqAttempt.questionId, input),
            isNull(frqAttempt.scoredPoints),
            isNotNull(frqAttempt.response),
          ),
        )
        .innerJoin(question, eq(question.id, frqAttempt.questionId))
        .innerJoin(stimulus, eq(stimulus.id, question.stimulusId))

      const gradingResponse = z
        .object({
          earned: z
            .number()
            .describe(
              "The amount of points the student got on this task point. This usually should be 1 or 2 points.",
            ),
          explanation: z
            .string()
            .describe(
              "An explanation on why the student got the point, do quote phrases and sentences from the student's response.",
            ),
        })
        .array()
        .describe(
          "A list of requirements the student response must fulfill corresponding to the grading guidelines, each requirement that is fulfilled earns the student some points.",
        )
      const gradingResponseSchema = zodToJsonSchema(gradingResponse)

      const grade = retryAsyncFn(
        "grade response",
        5,
        async (stimulus: string, question: string, response: string) => {
          const res = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content:
                  "You are a grader employed by the Collegeboard to grade the responses to free response questions in the AP US History exam.",
              },
              {
                role: "user",
                content: `Grade the following response. Make sure to call the score_response tool.\nQuestion stimulus: ${stimulus}\nQuestion: ${question}\nStudent response: ${response}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "score_response",
                  description: "Score the student's response.",
                  parameters: gradingResponseSchema,
                },
              },
            ],
          })
          const completion = res.choices[0].message.content
          if (!completion) {
            throw new Error("empty completion!")
          }
          return gradingResponse.parse(JSON.parse(completion))
        },
      )

      await Promise.all(
        responded.map(async (r) => {
          const scored = await grade(
            `${
              stimulus.imageAltText
                ? "This is an image with the following description: "
                : ""
            }${stimulus.imageAltText}\n- ${stimulus.attribution}`,
            r.question,
            r.response ?? "",
          )

          let totalScored = 0
          for (const val of scored) {
            totalScored += val.earned
          }

          await db
            .update(frqAttempt)
            .set({
              scoredPoints: totalScored,
              scoringNotes: scored
                .map((s) => `- +${s.earned} pt - ${s.explanation}`)
                .join("\n"),
            })
            .where(eq(frqAttempt.questionId, r.questionId))
        }),
      )
    }),
  listTests: t.procedure.query(({ ctx: { db, userEmail } }) => {
    return db
      .select()
      .from(testAttempt)
      .where(eq(testAttempt.userEmail, userEmail))
  }),
  getTest: t.procedure
    .input(z.number().describe("testAttempt.id"))
    .query(({ ctx: { db }, input }) => {
      return db.query.testAttempt.findFirst({
        with: {
          mcqAttempt: {
            with: {
              question: {
                with: {
                  questionChoice: true,
                  stimulus: true,
                },
              },
            },
          },
          frqAttempt: {
            with: {
              question: {
                with: {
                  stimulus: true,
                },
              },
            },
          },
        },
        where: eq(testAttempt.id, input),
      })
    }),
})
