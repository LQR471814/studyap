import type { DB } from "@/lib/db"
import type { LLM } from "@/lib/llm/core"
import {
  frqAttempt,
  mcqAttempt,
  subject,
  testAttempt,
  unit,
  user,
} from "@/lib/schema/schema"
import type { Span } from "@opentelemetry/api"
import { initTRPC } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import superjson from "superjson"
import { z } from "zod"
import { createTest, createTestOptions } from "./methods/createTest"
import { evalFRQs } from "./methods/evalFrqs"
import { evalMCQs } from "./methods/evalMcqs"
import { evalTest } from "./methods/evalTest"
import { getAvailableQuestionCount } from "./methods/getAvailableQuestions"
import { getTest } from "./methods/getTest"
import { listCompleteTests } from "./methods/listCompleteTests"

type Context = {
  span: Span
  db: DB
  llm: LLM
  userEmail: string
}

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const protectedRouter = t.router({
  profile: t.procedure.query(async ({ ctx: { db, userEmail } }) => {
    await db.insert(user).values({ email: userEmail }).onConflictDoNothing()
    const [profile] = await db
      .select()
      .from(user)
      .where(eq(user.email, userEmail))
    return profile
  }),
  createTest: t.procedure
    .input(createTestOptions)
    .mutation(async ({ ctx: { span, db, userEmail }, input }) => {
      const res = await createTest(span, userEmail, db, input)
      if (res instanceof Error) {
        throw res
      }
      return res
    }),
  deleteTest: t.procedure
    .input(z.number().describe("test.id"))
    .mutation(async ({ ctx: { db }, input }) => {
      await db.delete(testAttempt).where(eq(testAttempt.id, input))
    }),
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
  getTest: t.procedure
    .input(z.number().describe("testAttempt.id"))
    .query(({ ctx: { db, userEmail }, input }) => {
      return getTest(db, userEmail, input)
    }),
  fillFRQs: t.procedure
    .input(
      z
        .object({
          testAttemptId: z.number(),
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
              .where(
                and(
                  eq(frqAttempt.questionId, c.questionId),
                  eq(frqAttempt.testId, c.testAttemptId),
                ),
              )
          }),
        )
      })
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
      await db.transaction((tx) => {
        return Promise.all(
          input.questions.map((r) =>
            tx
              .update(mcqAttempt)
              .set({
                response: r.questionChoiceId,
              })
              .where(
                and(
                  eq(mcqAttempt.testId, input.testAttemptId),
                  eq(mcqAttempt.questionId, r.questionId),
                ),
              ),
          ),
        )
      })
    }),
  evalMCQs: t.procedure
    .input(z.number().array().describe("list of question.ids"))
    .mutation(({ ctx: { db }, input }) => {
      return evalMCQs(db, input)
    }),
  evalFRQs: t.procedure
    .input(z.number().array().describe("list of frqAttempt.ids"))
    .mutation(({ ctx: { span, db, llm }, input }) => {
      return evalFRQs(span, db, llm, input)
    }),
  evalTest: t.procedure
    .input(z.number().describe("testAttempt.id"))
    .mutation(({ ctx: { span, db, llm }, input }) => {
      return evalTest(span, db, llm, input)
    }),
  listIncompleteTests: t.procedure.query(({ ctx: { db, userEmail } }) => {
    return db
      .select({
        id: testAttempt.id,
        createdAt: testAttempt.createdAt,
        subjectName: subject.name,
        subjectId: subject.id,
      })
      .from(testAttempt)
      .where(
        and(
          eq(testAttempt.userEmail, userEmail),
          eq(testAttempt.complete, false),
        ),
      )
      .innerJoin(subject, eq(testAttempt.subjectId, subject.id))
  }),
  listCompleteTests: t.procedure.query(({ ctx: { db, userEmail } }) => {
    return listCompleteTests(db, userEmail)
  }),
})

export type ProtectedRouter = typeof protectedRouter
export type Test = Awaited<ReturnType<(typeof protectedRouter)["getTest"]>>
