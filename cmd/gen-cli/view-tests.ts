import * as schema from "@/schema/tests"
import { eq } from "drizzle-orm"
import FlagSet, { integer, multiple } from "jsflags"
import { parseNodejs } from "jsflags/node"
import { getTest } from "../../lib/generators/utils"
import { db } from "./common"

const flags = new FlagSet(multiple(integer))
const ids = parseNodejs(flags)

async function formatTest(id: number) {
  const [test] = await db.select()
    .from(schema.test)
    .where(eq(schema.test.id, id))
  if (!test) {
    console.error(`could not find test with id ${id}`)
    process.exit(1)
  }

  const fullTest = await getTest(db, id)

  let out = `============= ${test.subject} =============\n`
  out += `id: ${id}\ngenerator version: ${test.generatorVersion}\n`

  let offset = 1
  for (const mcq of fullTest.mcqs) {
    out += `\n----- MCQ "${mcq.unit}" (${offset}-${offset + mcq.questions.length - 1}) -----\n`
    out += `\n  ${mcq.text}\n`
    for (let i = 0; i < mcq.questions.length; i++) {
      const { question, answer, options, explanation } = mcq.questions[i]

      out += `\n  ${offset + i}. ${question}`
      for (let optidx = 0; optidx < options.length; optidx++) {
        out += `\n    ${String.fromCharCode(65 + optidx)}. ${options[optidx]}`
        if (optidx === answer) {
          out += ` (CORRECT ANSWER: ${explanation})`
        }
      }
    }
    offset += mcq.questions.length
    out += "\n"
  }

  for (const frq of fullTest.frqs) {
    out += `\n----- FRQ "${frq.unit}" -----\n`
    out += `\n  ${frq.text}\n`
    for (let i = 0; i < frq.questions.length; i++) {
      const { question } = frq.questions[i]
      out += `\n  ${String.fromCharCode(97 + i)}. ${question}`
    }
    out += "\n"
  }

  return out
}

async function main() {
  const representations = await Promise.all(ids.map(id => formatTest(id)))
  for (const r of representations) {
    console.log(r)
  }
  process.exit(0)
}

main()
