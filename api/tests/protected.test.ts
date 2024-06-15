import {
  question,
  stimulus,
  subject as subjectRow,
  unit,
} from "@/lib/schema/schema"
import { describe, expect, test } from "vitest"
import { setupAPI, setupDummyDB } from "./setup"
import type { Test } from "../protected"
import { createFnSpanner } from "@/lib/telemetry/utils"

const fnSpan = createFnSpanner("test_protected")

describe("createTest", () => {
  return fnSpan(undefined, "createTest", async (span) => {
    function hasEmptyQuestionGroups(test: Test): boolean {
      for (const group of test.testStimulus) {
        if (group.frqAttempt.length === 0 && group.mcqAttempt.length === 0) {
          return true
        }
      }
      return false
    }

    function testRepeatFor3Users(
      name: string,
      fn: (
        ctx: Awaited<ReturnType<typeof setupDummyDB>>,
        userEmail: string,
      ) => Promise<void>,
      timeout?: number,
    ) {
      test(
        name,
        async () => {
          const ctx = await setupDummyDB(span)

          await Promise.all(
            ["alice@email.com", "bob@email.com", "cole@email.com"].map(
              (userEmail) => fn(ctx, userEmail),
            ),
          )
        },
        timeout,
      )
    }

    testRepeatFor3Users("happy path", (ctx, userEmail) => {
      const { db, subject, frqs, mcqs } = ctx

      return fnSpan(span, "happy path", async (span) => {
        span.setAttribute("custom.userEmail", userEmail)

        const { api } = await setupAPI(db, span, userEmail)

        try {
          await api.createTest({
            subject: subject.id,
            frqCount: 0,
            mcqCount: 0,
          })
          throw new Error("creating an empty test should throw")
        } catch (err) {
          expect((err as Error).message).toContain("empty test")
        }

        const testAttemptId1 = await api.createTest({
          subject: subject.id,
          frqCount: frqs.length,
          mcqCount: mcqs.length,
        })

        const listed = await api.listIncompleteTests()
        expect(listed.find((l) => l.id === testAttemptId1)).toBeDefined()

        const test = await api.getTest(testAttemptId1)
        expect(test).toBeDefined()
        expect(test?.userEmail).toEqual(userEmail)
        expect(test?.subjectId).toEqual(subject.id)
        expect(test.testStimulus.length).toBeGreaterThan(0)

        const noStimulus = test.testStimulus.find(
          (s) => s.mcqAttempt.length > 0 && s.stimulus.content === null,
        )
        expect(noStimulus?.mcqAttempt.length).toBe(1)

        const mcqWithStimulus = test.testStimulus.find(
          (s) => s.mcqAttempt.length > 0 && s.stimulusId !== null,
        )
        expect(mcqWithStimulus?.mcqAttempt.length).toBe(2)

        const frqWithStimulus = test.testStimulus.find(
          (s) => s.frqAttempt.length > 0,
        )
        expect(frqWithStimulus?.frqAttempt.length).toBe(1)

        try {
          await api.createTest({
            subject: subject.id,
            frqCount: frqs.length,
            mcqCount: 0,
          })
          throw new Error(
            "creating a test with less frqs available than expected should be impossible",
          )
        } catch (err) {
          expect((err as Error).message).toContain("not enough")
        }
        await api.deleteTest(testAttemptId1)
      })
    })

    testRepeatFor3Users("only-mcq or only-frq", (ctx, userEmail) => {
      const { db, subject, frqs, mcqs } = ctx

      return fnSpan(span, `only-mcq or only-frq -> ${userEmail}`, async (span) => {
        span.setAttribute("custom.userEmail", userEmail)

        const { api } = await setupAPI(db, span, userEmail)

        const testAttemptId2 = await api.createTest({
          subject: subject.id,
          frqCount: 0,
          mcqCount: mcqs.length,
        })
        const testAttemptId3 = await api.createTest({
          subject: subject.id,
          frqCount: frqs.length,
          mcqCount: 0,
        })

        const noFrqs = await api.getTest(testAttemptId2)
        const noMcqs = await api.getTest(testAttemptId3)

        expect(hasEmptyQuestionGroups(noFrqs)).toBe(false)
        expect(hasEmptyQuestionGroups(noMcqs)).toBe(false)

        await api.deleteTest(testAttemptId2)
        await api.deleteTest(testAttemptId3)
      })
    }, 30000)
  })
})

test("getAvailableQuestions", () => {
  return fnSpan(undefined, "getAvailableQuestions", async (span) => {
    const { db, units, subject, frqs, mcqs } = await setupDummyDB(span)
    const { api } = await setupAPI(db, span, "getAvailableQuestions@email.com")

    span.addEvent("db snapshot", {
      "custom.subject": JSON.stringify(await db.select().from(subjectRow)),
      "custom.units": JSON.stringify(await db.select().from(unit)),
      "custom.stimuli": JSON.stringify(await db.select().from(stimulus)),
      "custom.questions": JSON.stringify(await db.select().from(question)),
    })

    const happyPath = await api.getAvailableQuestions({
      subjectId: subject.id,
    })
    expect(happyPath.frqs).toEqual(frqs.length)
    expect(happyPath.mcqs).toEqual(mcqs.length)

    const emptyUnitIds = await api.getAvailableQuestions({
      subjectId: subject.id,
      unitIds: [],
    })
    expect(emptyUnitIds.frqs).toEqual(frqs.length)
    expect(emptyUnitIds.mcqs).toEqual(mcqs.length)

    const filterNone = await api.getAvailableQuestions({
      subjectId: subject.id,
      unitIds: [units[0].id],
    })
    expect(filterNone.frqs).toEqual(0)
    expect(filterNone.mcqs).toEqual(0)

    const filterSome = await api.getAvailableQuestions({
      subjectId: subject.id,
      unitIds: [units[4].id],
    })
    expect(filterSome.frqs).toEqual(0)
    expect(filterSome.mcqs).toEqual(3)

    const filterAll = await api.getAvailableQuestions({
      subjectId: subject.id,
      unitIds: [units[4].id, units[6].id],
    })
    expect(filterAll.frqs).toEqual(1)
    expect(filterAll.mcqs).toEqual(3)

    const testAttemptId = await api.createTest({
      subject: subject.id,
      frqCount: frqs.length,
      mcqCount: 0,
    })
    const withCreated = await api.getAvailableQuestions({
      subjectId: subject.id,
    })
    expect(withCreated.frqs).toEqual(0)
    expect(withCreated.mcqs).toEqual(mcqs.length)
    await api.deleteTest(testAttemptId)
  })
})
