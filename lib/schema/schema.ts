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
    userEmail: text("userEmail").notNull()
        .references(() => user.email, CASCADE)
})

export const mcqAttempt = sqliteTable("mcqAttempt", {
    testId: int("testId").notNull()
        .references(() => testAttempt.id, CASCADE),
    questionId: int("questionId").notNull()
        .references(() => mcq.id, CASCADE),
    correct: int("correct", { mode: "boolean" }).notNull(),
    response: int("response").notNull()
        .references(() => mcqChoice.id, CASCADE)
})

export const frqAttempt = sqliteTable("frqAttempt", {
    testId: int("testId").notNull()
        .references(() => testAttempt.id, CASCADE),
    questionId: int("questionId").notNull()
        .references(() => frq.id, CASCADE),
    scored: int("scored").notNull(),
    total: int("total").notNull(),
    response: text("response").notNull(),
})

export const subject = sqliteTable("subject", {
    id: text("id").notNull().primaryKey(),
    name: text("name").notNull(),
})

export const unit = sqliteTable("unit", {
    id: text("id").notNull().primaryKey(),
    subjectId: text("subjectId").notNull()
        .references(() => subject.id, CASCADE),
    name: text("name").notNull(),
})

export const stimulus = sqliteTable("stimulus", {
    id: int("id").notNull().primaryKey({ autoIncrement: true }),
    content: text("content"),
    imageUrl: text("imageUrl"),
})

export const mcq = sqliteTable("mcq", {
    id: int("id").notNull().primaryKey({ autoIncrement: true }),
    question: text("question").notNull(),
    imageUrl: text("imageUrl"),
})

export const mcqUnit = sqliteTable("mcqUnit", {
    unitId: int("unitId").notNull()
        .references(() => unit.id, CASCADE),
    mcqId: int("mcqId").notNull()
        .references(() => mcq.id, CASCADE)
}, (table) => ({
    pkey: primaryKey({ columns: [table.mcqId, table.unitId] })
}))

export const mcqChoice = sqliteTable("mcqChoice", {
    id: int("id").notNull().primaryKey({ autoIncrement: true }),
    questionId: int("questionId").notNull()
        .references(() => mcq.id, CASCADE),
    choice: text("choice").notNull(),
    correct: int("correct", { mode: "boolean" }).notNull(),
})

export const frq = sqliteTable("frq", {
    id: int("id").notNull().primaryKey({ autoIncrement: true }),
    question: text("question").notNull(),
    imageUrl: text("imageUrl"),
})

export const frqUnit = sqliteTable("frqUnit", {
    unitId: int("unitId").notNull()
        .references(() => unit.id, CASCADE),
    frqId: int("frqId").notNull()
        .references(() => frq.id, CASCADE)
}, (table) => ({
    pkey: primaryKey({ columns: [table.frqId, table.unitId] })
}))

