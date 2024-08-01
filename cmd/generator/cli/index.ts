import {
  Append,
  LLMGenerator,
  type LLMGeneratorConfig,
  LLMJobQueue,
} from "@/lib/llm-test-generator"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import * as schema from "@/lib/schema/schema"
import * as rels from "@/lib/schema/schema.relations"
import { createClient } from "@libsql/client"
import { eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import prompts from "prompts"

function previewString(text: string, len: number) {
  if (text.length > len) {
    return `${text.slice(0, len)}...`
  }
  return text
}

export const db = drizzle(
  createClient({
    url: process.env.DATABASE_URL ?? "http://127.0.0.1:8080",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
  { schema: { ...schema, ...rels } },
)

type nameId = {
  name: string
  id: number
}

export class CLI {
  subjectRow: nameId
  unitRows: nameId[]
  append: Append
  generator: LLMGenerator

  private constructor(
    subjectRow: nameId,
    unitRows: nameId[],
    append: Append,
    generator: LLMGenerator,
  ) {
    this.subjectRow = subjectRow
    this.unitRows = unitRows
    this.append = append
    this.generator = generator
  }

  static async create(
    subjectName: string,
    unitNames: string[],
    config: LLMGeneratorConfig,
  ) {
    const append = new Append(db, subjectName, unitNames, 1)

    // ensure subject and units already exist in db
    await append.execute()

    const llm = new LLMJobQueue(isomorphicLLMFromEnv())

    const [subjectRow] = await db
      .select()
      .from(schema.subject)
      .where(eq(schema.subject.name, subjectName))
    const unitRows = await db
      .select()
      .from(schema.unit)
      .where(eq(schema.unit.subjectId, subjectRow.id))

    const generator = new LLMGenerator(subjectName, unitNames, llm, config)

    return new CLI(subjectRow, unitRows, append, generator)
  }

  private async generateStimuliInner(
    units: nameId[],
    unitIds: number[],
  ): Promise<void> {
    const generated = await this.generator.stimulus(undefined, units)

    console.log("Is this okay?")
    console.log(generated.text)
    console.log(generated.attribution)

    const confirm = await prompts({
      name: "confirm",
      type: "select",
      message: "Is this okay?",
      choices: [
        { title: "Yes", value: true },
        { title: "No", value: false },
        { title: "Quit", value: null },
      ],
    })
    if (confirm.confirm === null) {
      console.log("[INFO] executing changes...")
      await this.append.execute()
      return
    }
    if (confirm.confirm) {
      this.append.stimulus({
        content: generated.text,
        attribution: generated.attribution,
        unitIds,
      })
    }

    return this.generateStimuliInner(units, unitIds)
  }
  async generateStimuli() {
    console.log(`Generating stimuli for ${this.subjectRow.name}`)

    const answer = await prompts({
      name: "units",
      type: "autocompleteMultiselect",
      message: "What units do you want to generate for?",
      choices: this.unitRows.map((u) => ({
        title: u.name,
        value: u,
      })),
    })
    const units: nameId[] = answer.units
    const unitIds = units.map((u) => u.id)

    if (unitIds.length === 0) {
      console.log("exiting...")
      return
    }

    await this.generateStimuliInner(units, unitIds)
  }

  private async generateMcqsInner(
    stimulus: { id: number; content: string },
    unitIds: number[],
  ): Promise<void> {
    const generated = await this.generator.mcq(undefined, stimulus)

    console.log("Is this okay?")
    console.log(generated.question)
    console.log(generated.choices)

    const confirm = await prompts({
      name: "confirm",
      type: "select",
      message: "Is this okay?",
      choices: [
        { title: "Yes", value: true },
        { title: "No", value: false },
        { title: "Quit", value: null },
      ],
    })
    if (confirm.confirm === null) {
      console.log("[INFO] executing changes...")
      await this.append.execute()
      return
    }
    if (confirm.confirm) {
      this.append.mcq({
        unitIds,
        stimulusId: stimulus.id,
        question: generated.question,
        choices: generated.choices,
      })
    }

    return this.generateMcqsInner(stimulus, unitIds)
  }
  async generateMcqs() {
    console.log(`Generating mcqs for ${this.subjectRow.name}`)

    const mcqQuestion = db
      .select()
      .from(schema.question)
      .where(eq(schema.question.format, "mcq"))
      .as("mcqQuestion")

    const existing = await db
      .select({
        id: schema.stimulus.id,
        attribution: schema.stimulus.attribution,
        content: schema.stimulus.content,
        mcqCount: sql<number | null>`count(distinct ${mcqQuestion.id})`,
      })
      .from(schema.stimulus)
      .leftJoin(mcqQuestion, eq(mcqQuestion.stimulusId, schema.stimulus.id))
      .groupBy(schema.stimulus.id)
    if (existing.length === 0) {
      console.log(
        "[WARN] you do not have any existing stimuli for this subject, please generate them first.",
      )
      return
    }

    const answer = await prompts({
      name: "stimulus",
      type: "select",
      message: "Choose which stimulus to use when generating mcqs.",
      choices: existing.map((stimulus) => ({
        title: `${previewString(stimulus.attribution ?? "", 48)} (mcqs: ${stimulus.mcqCount ?? 0})`,
        value: stimulus,
      })),
    })

    const stimulusAnswer: (typeof existing)[number] = answer.stimulus

    const unitIds = (
      await db
        .select({ id: schema.stimulusUnit.unitId })
        .from(schema.stimulusUnit)
        .where(eq(schema.stimulusUnit.stimulusId, stimulusAnswer.id))
    ).map((row) => row.id)

    this.generateMcqsInner(
      {
        id: stimulusAnswer.id,
        content: stimulusAnswer.content ?? "",
      },
      unitIds,
    )
  }

  private async generateFrqsInner(
    stimulus: { id: number; content: string },
    unitIds: number[],
  ): Promise<void> {
    const generated = await this.generator.frqs(undefined, stimulus)

    console.log("Is this okay?")
    console.log("Total points:", generated.totalPoints)
    console.log(generated.question)
    console.log("Grading guidelines:", generated.guidelines)

    const confirm = await prompts({
      name: "confirm",
      type: "select",
      message: "Is this okay?",
      choices: [
        { title: "Yes", value: true },
        { title: "No", value: false },
        { title: "Quit", value: null },
      ],
    })
    if (confirm.confirm === null) {
      console.log("[INFO] executing changes...")
      await this.append.execute()
      return
    }
    if (confirm.confirm) {
      this.append.frq({
        unitIds,
        stimulusId: stimulus.id,
        question: generated.question,
        gradingGuidelines: generated.guidelines,
        totalPoints: generated.totalPoints,
      })
    }

    return this.generateMcqsInner(stimulus, unitIds)
  }
  async generateFrqs() {
    console.log(`Generating frqs for ${this.subjectRow.name}`)

    const frqQuestion = db
      .select()
      .from(schema.question)
      .where(eq(schema.question.format, "frq"))
      .as("frqQuestion")

    const existing = await db
      .select({
        id: schema.stimulus.id,
        attribution: schema.stimulus.attribution,
        content: schema.stimulus.content,
        frqCount: sql<number | null>`count(distinct ${frqQuestion.id})`,
      })
      .from(schema.stimulus)
      .leftJoin(frqQuestion, eq(frqQuestion.stimulusId, schema.stimulus.id))
      .groupBy(schema.stimulus.id)
    if (existing.length === 0) {
      console.log(
        "[WARN] you do not have any existing stimuli for this subject, please generate them first.",
      )
      return
    }

    const answer = await prompts({
      name: "stimulus",
      type: "select",
      message: "Choose which stimulus to use when generating frqs.",
      choices: existing.map((stimulus) => ({
        title: `${previewString(stimulus.attribution ?? "", 48)} (frqs: ${stimulus.frqCount ?? 0})`,
        value: stimulus,
      })),
    })

    const stimulusAnswer: (typeof existing)[number] = answer.stimulus

    const unitIds = (
      await db
        .select({ id: schema.stimulusUnit.unitId })
        .from(schema.stimulusUnit)
        .where(eq(schema.stimulusUnit.stimulusId, stimulusAnswer.id))
    ).map((row) => row.id)

    this.generateFrqsInner(
      {
        id: stimulusAnswer.id,
        content: stimulusAnswer.content ?? "",
      },
      unitIds,
    )
  }
}
