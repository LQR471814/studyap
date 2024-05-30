import { relations } from "drizzle-orm";
import { frq, frqUnit, mcq, mcqAttempt, mcqChoice, mcqUnit, stimulus, subject, testAttempt, unit, user } from "./schema";
export const frqRelations = relations(frq, ({ one, many }) => ({
    frqUnit: many(frqUnit)
}));
export const frqUnitRelations = relations(frqUnit, ({ one, many }) => ({
    unit: one(unit, {
        fields: [frqUnit.unitId],
        references: [unit.id]
    }),
    frq: one(frq, {
        fields: [frqUnit.frqId],
        references: [frq.id]
    })
}));
export const mcqRelations = relations(mcq, ({ one, many }) => ({
    mcqChoice: many(mcqChoice),
    mcqUnit: many(mcqUnit)
}));
export const mcqAttemptRelations = relations(mcqAttempt, ({ one, many }) => ({
    testAttempt: one(testAttempt, {
        fields: [mcqAttempt.testId],
        references: [testAttempt.id]
    })
}));
export const mcqChoiceRelations = relations(mcqChoice, ({ one, many }) => ({
    mcq: one(mcq, {
        fields: [mcqChoice.questionId],
        references: [mcq.id]
    })
}));
export const mcqUnitRelations = relations(mcqUnit, ({ one, many }) => ({
    unit: one(unit, {
        fields: [mcqUnit.unitId],
        references: [unit.id]
    }),
    mcq: one(mcq, {
        fields: [mcqUnit.mcqId],
        references: [mcq.id]
    })
}));
export const subjectRelations = relations(subject, ({ one, many }) => ({
    unit: many(unit)
}));
export const testAttemptRelations = relations(testAttempt, ({ one, many }) => ({
    mcqAttempt: many(mcqAttempt),
    user: one(user, {
        fields: [testAttempt.userEmail],
        references: [user.email]
    })
}));
export const unitRelations = relations(unit, ({ one, many }) => ({
    frqUnit: many(frqUnit),
    mcqUnit: many(mcqUnit),
    subject: one(subject, {
        fields: [unit.subjectId],
        references: [subject.id]
    })
}));
export const userRelations = relations(user, ({ one, many }) => ({
    testAttempt: many(testAttempt)
}));
