import { sqliteTable, int, text, primaryKey } from "drizzle-orm/sqlite-core"

const CASCADE = {
  onDelete: "cascade",
  onUpdate: "cascade",
} as const

export const user = sqliteTable("user", {
  email: text("email").notNull().primaryKey(),
  name: text("name").notNull(),
})

export const testAttempt = sqliteTable("testAttempt", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  userEmail: text("userEmail")
    .notNull()
    .references(() => user.email, CASCADE),
})

export const mcqAttempt = sqliteTable(
  "mcqAttempt",
  {
    testId: int("testId")
      .notNull()
      .references(() => testAttempt.id, CASCADE),
    questionId: int("questionId")
      .notNull()
      .references(() => question.id, CASCADE),
    scoredPoints: int("scoredPoints"),
    response: int("response").references(() => questionChoice.id, CASCADE),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.testId, table.questionId] }),
  }),
)

export const frqAttempt = sqliteTable(
  "frqAttempt",
  {
    testId: int("testId")
      .notNull()
      .references(() => testAttempt.id, CASCADE),
    questionId: int("questionId")
      .notNull()
      .references(() => question.id, CASCADE),
    scoredPoints: int("scoredPoints"),
    scoringNotes: text("scoringNotes"),
    response: text("response"),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.testId, table.questionId] }),
  }),
)

export const subject = sqliteTable("subject", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const unit = sqliteTable("unit", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  name: text("name").notNull(),
})

export const stimulus = sqliteTable("stimulus", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  // markdown which can contain latex/html
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  imageAltText: text("imageAltText"),
  attribution: text("attribution").notNull(),
  forFormat: text("forFormat")
    .notNull()
    .$type<(typeof questionFormat)[number]>(),
})

export const questionFormat = ["mcq", "frq"] as const

export const question = sqliteTable("question", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  stimulusId: int("stimulusId").references(() => stimulus.id, CASCADE),
  format: text("format").notNull().$type<(typeof questionFormat)[number]>(),
  content: text("content").notNull(),
  totalPoints: int("totalPoints").notNull(),
})

export const questionUnit = sqliteTable(
  "questionUnit",
  {
    unitId: int("unitId")
      .notNull()
      .references(() => unit.id, CASCADE),
    questionId: int("questionId")
      .notNull()
      .references(() => question.id, CASCADE),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.questionId, table.unitId] }),
  }),
)

export const questionGradingGuidelines = sqliteTable(
  "questionGradingGuidelines",
  {
    questionId: int("questionId")
      .notNull()
      .primaryKey()
      .references(() => question.id, CASCADE),
    content: text("content").notNull(),
  },
)

export const questionChoice = sqliteTable("questionChoice", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  questionId: int("questionId")
    .notNull()
    .references(() => question.id, CASCADE),
  choice: text("choice").notNull(),
  correct: int("correct", { mode: "boolean" }).notNull(),
  explanation: text("explanation"),
})
