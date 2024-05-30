import FlagSet, { integer } from "jsflags"
import { parseNodejs } from "jsflags/node"
import * as schema from "@/schema/tests"
import { generators } from "@/lib/generators"
import { Test } from "@/lib/generators/types"
import { DB } from "@/lib/db"
import { db, openai } from "./common"

const flags = new FlagSet()

const testCount = flags.flag(integer, "count", "the amount of tests to generate for each subject")

parseNodejs(flags)

async function uploadTest(db: DB, subject: schema.Subject, testObj: Test) {
  await db.transaction(async (tx) => {
    const [test] = await tx.insert(schema.test).values({
      subject: subject,
      generatorVersion: testObj.generatorVersion,
    }).returning()

    await Promise.all(
      [
        ...testObj.mcqs.map(async (stimulusObj) => {
          const [stimulus] = await tx.insert(schema.stimulus).values({
            text: stimulusObj.text,
            unit: stimulusObj.unit,
            testId: test.id,
          }).returning()

          await Promise.all(
            stimulusObj.questions.map(async (mcqObj) => {
              const [mcq] = await tx.insert(schema.mcq).values({
                question: mcqObj.question,
                stimulusId: stimulus.id,
                answerIndex: mcqObj.answer,
                explanation: mcqObj.explanation,
              }).returning()

              await Promise.all(
                mcqObj.options.map((mcqOptObj, i) => tx.insert(schema.mcqOption).values({
                  index: i,
                  text: mcqOptObj,
                  mcqId: mcq.id,
                }))
              )
            })
          )
        }),
        ...testObj.frqs.map(async (stimulusObj) => {
          const [stimulus] = await tx.insert(schema.stimulus).values({
            text: stimulusObj.text,
            unit: stimulusObj.unit,
            testId: test.id,
          }).returning()

          await Promise.all(
            stimulusObj.questions.map((frqObj, i) => tx.insert(schema.frqPart).values({
              stimulusId: stimulus.id,
              partNo: i,
              question: frqObj.question,
            }))
          )
        })
      ]
    )
  })
}

async function main() {
  await Promise.all(
    new Array(testCount.value)
      .fill(undefined)
      .flatMap((_, i) => generators(openai).map(async (gen) => {
        const debugName = `${gen.subject} #${i + 1}`
        console.log(`generating test for ${debugName}...`)
        const test = await gen.generate()
        console.log(`uploading test for ${debugName}...`)
        await uploadTest(db, gen.subject, test)
        console.log(`finished creating test for ${debugName}.`)
      }))
  )
  process.exit(0)
}

main()

