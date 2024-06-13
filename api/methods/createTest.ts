import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  question,
  questionUnit,
  testAttempt,
  testStimulus,
} from "@/lib/schema/schema"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { z } from "zod"
import { fnSpan } from "@/api/tracer"
import type { Span } from "@opentelemetry/api"

export const createTestOptions = z.object({
  subject: z.number(),
  units: z.array(z.number()).optional(),
  mcqCount: z.number(),
  frqCount: z.number(),
})
export type CreateTestOptions = z.TypeOf<typeof createTestOptions>

export async function createTest(
  span: Span | undefined,
  userEmail: string,
  db: DB,
  options: CreateTestOptions,
) {
  return fnSpan(span, "createTest", async (span) => {
    if (span.isRecording()) {
      span.setAttribute("subject", options.subject)
      span.setAttribute("mcqCount", options.mcqCount)
      span.setAttribute("frqCount", options.frqCount)
      if (options.units) {
        span.setAttribute("units", options.units)
      }
    }
    return createTestInner(span, userEmail, db, options)
  })
}

async function createTestInner(
  span: Span | undefined,
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

  if (span?.isRecording()) {
    span.addEvent("returned mcqs", {
      result: JSON.stringify(mcqs),
    })
  }

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

  if (span?.isRecording()) {
    span.addEvent("returned frqs", {
      result: JSON.stringify(frqs),
    })
  }

  return await db.transaction(async (tx) => {
    const [attempt] = await tx
      .insert(testAttempt)
      .values({
        userEmail,
        subjectId: options.subject,
        createdAt: new Date(),
        complete: false,
      })
      .returning()

    const testStimuli: (typeof testStimulus)["$inferInsert"][] = []
    let groupNumber = 0
    // undefined is the initial value, because the first question's stimulus must
    // always be added
    // null represents no stimulus, but should still be added to preserve the correct order
    let lastStimulusId: number | undefined
    for (const question of mcqs) {
      if (question.stimulusId === lastStimulusId) {
        continue
      }
      testStimuli.push({
        testId: attempt.id,
        groupNumber,
        stimulusId: question.stimulusId,
      })
      lastStimulusId = question.stimulusId
      groupNumber++
    }
    lastStimulusId = undefined

    if (span?.isRecording()) {
      span.addEvent("returned stimuli 1", {
        result: JSON.stringify(testStimuli),
      })
    }

    for (const question of frqs) {
      if (question.stimulusId === lastStimulusId) {
        continue
      }
      testStimuli.push({
        testId: attempt.id,
        groupNumber,
        stimulusId: question.stimulusId,
      })
      lastStimulusId = question.stimulusId
      groupNumber++
    }

    if (span?.isRecording()) {
      span.addEvent("returned stimuli 2", {
        result: JSON.stringify(testStimuli),
      })
    }

    await tx.insert(testStimulus).values(testStimuli).onConflictDoNothing()

    let questionNo = 0
    if (options.mcqCount > 0) {
      await tx.insert(mcqAttempt).values(
        mcqs.map((q) => ({
          testId: attempt.id,
          stimulusId: q.stimulusId,
          questionId: q.id,
          questionNumber: ++questionNo,
        })),
      )
    }
    if (options.frqCount > 0) {
      await tx.insert(frqAttempt).values(
        frqs.map((q) => ({
          testId: attempt.id,
          stimulusId: q.stimulusId,
          questionId: q.id,
          questionNumber: ++questionNo,
        })),
      )
    }

    return attempt.id
  })
}
