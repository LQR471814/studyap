import * as schema from "@/schema/tests"
import { db } from "./common"

async function main() {
  const tests = await db.select().from(schema.test)
  console.log(`${"subject".padEnd(18)} | ${"id".padEnd(3)} | version`)
  for (const t of tests) {
    const subject = t.subject.padEnd(18)
    const id = t.id.toString().padEnd(3)
    const version = t.generatorVersion.toString()
    console.log(`${subject} | ${id} | ${version}`)
  }
}

main()

