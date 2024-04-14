import { db } from "@/lib/db";
import { FRQ, MCQ, Stimulus, Test } from "./types";
import * as schema from "@/schema/tests"
import { asc, eq } from "drizzle-orm";

export async function getTest(id: number): Promise<Test> {
  const test = await db.query.test.findFirst({
    with: {
      stimulus: {
        with: {
          frqPart: {
            orderBy: asc(schema.frqPart.partNo)
          },
          mcq: {
            with: {
              mcqOption: {
                orderBy: asc(schema.mcqOption.index)
              },
            }
          }
        }
      }
    },
    where: eq(schema.test.id, id)
  })
  if (!test) {
    throw new Error(`could not find test with id ${id}`)
  }

  const mcqResults: Stimulus<MCQ>[] = []
  const frqResults: Stimulus<FRQ>[] = []

  for (const stimulus of test.stimulus) {
    if (stimulus.mcq.length > 0) {
      mcqResults.push({
        text: stimulus.text,
        unit: stimulus.unit,
        questions: stimulus.mcq.map(q => ({
          question: q.question,
          explanation: q.explanation,
          answer: q.answerIndex,
          options: q.mcqOption.map((o) => o.text),
        }))
      })
      continue
    }

    frqResults.push({
      text: stimulus.text,
      unit: stimulus.unit,
      questions: stimulus.frqPart
    })
  }

  return {
    subject: test.subject,
    generatorVersion: test.generatorVersion,
    mcqs: mcqResults,
    frqs: frqResults,
  }
}
