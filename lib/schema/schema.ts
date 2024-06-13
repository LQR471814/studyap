import {
  sqliteTable,
  int,
  text,
  primaryKey,
  foreignKey,
} from "drizzle-orm/sqlite-core"

const CASCADE = {
  onDelete: "cascade",
  onUpdate: "cascade",
} as const

export const pendingVerification = sqliteTable(
  "pendingVerification",
  {
    code: text("code").notNull().primaryKey(),
    token: text("token").notNull().unique(),
    email: text("email").notNull(),
    expiresAt: int("expiresAt", { mode: "timestamp" }).notNull(),
  },
)

export const activeToken = sqliteTable(
  "activeToken",
  {
    token: text("token").notNull(),
    userEmail: text("userEmail")
      .notNull()
      .references(() => user.email, CASCADE),
    expiresAt: int("expiresAt", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.token, table.userEmail] }),
  }),
)

export const user = sqliteTable("user", {
  email: text("email").notNull().primaryKey(),
})

export const testAttempt = sqliteTable("testAttempt", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  userEmail: text("userEmail")
    .notNull()
    .references(() => user.email, CASCADE),
  createdAt: int("createdAt", { mode: "timestamp" }).notNull(),
  complete: int("complete", { mode: "boolean" }).notNull(),
})

export const testStimulus = sqliteTable(
  "testStimulus",
  {
    testId: int("testId")
      .notNull()
      .references(() => testAttempt.id, CASCADE),
    stimulusId: int("stimulusId")
      .notNull()
      .references(() => stimulus.id, CASCADE),
    groupNumber: int("groupNumber").notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.testId, table.stimulusId] }),
  }),
)

export const mcqAttempt = sqliteTable(
  "mcqAttempt",
  {
    testId: int("testId")
      .notNull()
      .references(() => testAttempt.id, CASCADE),
    stimulusId: int("stimulusId")
      .notNull()
      .references(() => stimulus.id, CASCADE),
    questionId: int("questionId")
      .notNull()
      .references(() => question.id, CASCADE),
    questionNumber: int("questionNumber").notNull(),
    scoredPoints: int("scoredPoints"),
    response: int("response").references(() => questionChoice.id, CASCADE),
  },
  (table) => ({
    testStimulusId: foreignKey({
      columns: [table.testId, table.stimulusId],
      foreignColumns: [testStimulus.testId, testStimulus.stimulusId],
    }),
  }),
)

export const frqAttempt = sqliteTable(
  "frqAttempt",
  {
    testId: int("testId")
      .notNull()
      .references(() => testAttempt.id, CASCADE),
    stimulusId: int("stimulusId")
      .notNull()
      .references(() => stimulus.id, CASCADE),
    questionId: int("questionId")
      .notNull()
      .references(() => question.id, CASCADE),
    questionNumber: int("questionNumber").notNull(),
    scoredPoints: int("scoredPoints"),
    scoringNotes: text("scoringNotes"),
    response: text("response"),
  },
  (table) => ({
    testStimulusId: foreignKey({
      columns: [table.testId, table.stimulusId],
      foreignColumns: [testStimulus.testId, testStimulus.stimulusId],
    }),
  }),
)

export const subject = sqliteTable("subject", {
  version: int("version").notNull(),
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const unit = sqliteTable("unit", {
  version: int("version").notNull(),
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  name: text("name").notNull(),
})

export const stimulus = sqliteTable("stimulus", {
  version: int("version").notNull(),
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  // markdown which can contain latex/html
  content: text("content"),
  imageUrl: text("imageUrl"),
  imageAltText: text("imageAltText"),
  attribution: text("attribution"),
})

export const stimulusUnit = sqliteTable(
  "stimulusUnit",
  {
    stimulusId: int("stimulusId")
      .notNull()
      .references(() => stimulus.id, CASCADE),
    unitId: int("unitId")
      .notNull()
      .references(() => unit.id, CASCADE),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.stimulusId, table.unitId] }),
  }),
)

export const questionFormat = ["mcq", "frq"] as const

export const question = sqliteTable("question", {
  version: int("version").notNull(),
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  subjectId: int("subjectId")
    .notNull()
    .references(() => subject.id, CASCADE),
  stimulusId: int("stimulusId")
    .notNull()
    .references(() => stimulus.id, CASCADE),
  format: text("format").notNull().$type<(typeof questionFormat)[number]>(),
  content: text("content").notNull(),
  totalPoints: int("totalPoints").notNull(),
  gradingGuidelines: text("gradingGuidelines"),
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

export const questionChoice = sqliteTable("questionChoice", {
  id: int("id").notNull().primaryKey({ autoIncrement: true }),
  questionId: int("questionId")
    .notNull()
    .references(() => question.id, CASCADE),
  choice: text("choice").notNull(),
  correct: int("correct", { mode: "boolean" }).notNull(),
  explanation: text("explanation"),
})
