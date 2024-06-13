import { fnSpan } from "../tracer"
import { setupDummyDB } from "./setup"
import { test, expect } from "vitest"

test("createTest", () => {
  return fnSpan(undefined, "createTest", async (span) => {
    const { api, testEmail, subject, frqs, mcqs } = await setupDummyDB(span)

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
    expect(test?.userEmail).toEqual(testEmail)
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

test("getAvailableQuestions", () => {
  return fnSpan(undefined, "getAvailableQuestions", async (span) => {
    const { api, units, subject, frqs, mcqs } = await setupDummyDB(span)

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
