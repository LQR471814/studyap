import { sqliteTable, int, text, primaryKey } from "drizzle-orm/sqlite-core"

const CASCADE_ALL = {
  onDelete: "cascade",
  onUpdate: "cascade",
} as const

export type Subject = typeof subject[number]

/**
 * "supported" subjects are listed here
 */
export const subject = ["ap_us_history"] as const

/**
 * Designates which version of the generator to use for various
 * subjects. If a version number cannot be found, it should default
 * to the latest version.
 */
export const useGenVersion = sqliteTable("useGenVersion", {
  subject: text("subject", { enum: subject }).notNull().unique(),
  generatorVersion: int("generatorVersion").notNull(),
})

export const test = sqliteTable("test", {
  id: int("id").primaryKey({ autoIncrement: true }).notNull(),
  subject: text("subject", { enum: subject }).notNull(),
  /**
   * details the version of the generator used to create the test.
   * allows us to delete old tests if we want to
   */
  generatorVersion: int("generatorVersion").notNull(),
})

/**
 * there can exist multiple MCQs or FRQs per stimuli
 */
export const stimulus = sqliteTable("stimulus", {
  id: int("id").primaryKey({ autoIncrement: true }).notNull(),
  unit: text("unit").notNull(),
  text: text("text").notNull(),
  testId: int("testId").notNull().references(() => test.id, CASCADE_ALL)
})

/**
 * multi-choice question
 */
export const mcq = sqliteTable("mcq", {
  id: int("id").primaryKey({ autoIncrement: true }).notNull(),
  question: text("question").notNull(),
  stimulusId: int("stimulusId").notNull().references(() => stimulus.id, CASCADE_ALL),
  answerIndex: int("answerIndex").notNull(),
  explanation: text("explanation").notNull(),
})

/**
 * the options you get to choose from in a multi-choice question
 */
export const mcqOption = sqliteTable("mcqOption", {
  index: int("index").notNull(),
  mcqId: int("mcqId").notNull().references(() => mcq.id, CASCADE_ALL),
  text: text("text").notNull(),
}, (self) => ({
  id: primaryKey({
    name: "id",
    columns: [self.index, self.mcqId]
  })
}))

/**
 * there can exist multiple parts to an FRQ (ex. part A, part B, ...)
 */
export const frqPart = sqliteTable("frqPart", {
  stimulusId: int("stimulusId").notNull().references(() => stimulus.id, CASCADE_ALL),
  partNo: int("partNo").notNull(),
  question: text("question").notNull(),
}, (self) => ({
  id: primaryKey({
    name: "id",
    columns: [self.stimulusId, self.partNo]
  })
}))

