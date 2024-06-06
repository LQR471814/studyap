import { relations } from "drizzle-orm";
import { frqAttempt, mcqAttempt, question, questionChoice, questionFormat, questionGradingGuidelines, questionUnit, stimulus, subject, testAttempt, unit, user } from "./schema";
export const frqAttemptRelations = relations(frqAttempt, ({ one, many }) => ({
    testAttempt: one(testAttempt, {
        fields: [frqAttempt.testId],
        references: [testAttempt.id]
    }),
    question: one(question, {
        fields: [frqAttempt.questionId],
        references: [question.id]
    })
}));
export const mcqAttemptRelations = relations(mcqAttempt, ({ one, many }) => ({
    testAttempt: one(testAttempt, {
        fields: [mcqAttempt.testId],
        references: [testAttempt.id]
    }),
    question: one(question, {
        fields: [mcqAttempt.questionId],
        references: [question.id]
    }),
    questionChoice: one(questionChoice, {
        fields: [mcqAttempt.response],
        references: [questionChoice.id]
    })
}));
export const questionRelations = relations(question, ({ one, many }) => ({
    frqAttempt: many(frqAttempt),
    mcqAttempt: many(mcqAttempt),
    subject: one(subject, {
        fields: [question.subjectId],
        references: [subject.id]
    }),
    stimulus: one(stimulus, {
        fields: [question.stimulusId],
        references: [stimulus.id]
    }),
    questionChoice: many(questionChoice),
    questionGradingGuidelines: many(questionGradingGuidelines),
    questionUnit: many(questionUnit)
}));
export const questionChoiceRelations = relations(questionChoice, ({ one, many }) => ({
    mcqAttempt: many(mcqAttempt),
    question: one(question, {
        fields: [questionChoice.questionId],
        references: [question.id]
    })
}));
export const questionGradingGuidelinesRelations = relations(questionGradingGuidelines, ({ one, many }) => ({
    question: one(question, {
        fields: [questionGradingGuidelines.questionId],
        references: [question.id]
    })
}));
export const questionUnitRelations = relations(questionUnit, ({ one, many }) => ({
    unit: one(unit, {
        fields: [questionUnit.unitId],
        references: [unit.id]
    }),
    question: one(question, {
        fields: [questionUnit.questionId],
        references: [question.id]
    })
}));
export const stimulusRelations = relations(stimulus, ({ one, many }) => ({
    question: many(question),
    subject: one(subject, {
        fields: [stimulus.subjectId],
        references: [subject.id]
    })
}));
export const subjectRelations = relations(subject, ({ one, many }) => ({
    question: many(question),
    stimulus: many(stimulus),
    testAttempt: many(testAttempt),
    unit: many(unit)
}));
export const testAttemptRelations = relations(testAttempt, ({ one, many }) => ({
    frqAttempt: many(frqAttempt),
    mcqAttempt: many(mcqAttempt),
    subject: one(subject, {
        fields: [testAttempt.subjectId],
        references: [subject.id]
    }),
    user: one(user, {
        fields: [testAttempt.userEmail],
        references: [user.email]
    })
}));
export const unitRelations = relations(unit, ({ one, many }) => ({
    questionUnit: many(questionUnit),
    subject: one(subject, {
        fields: [unit.subjectId],
        references: [subject.id]
    })
}));
export const userRelations = relations(user, ({ one, many }) => ({
    testAttempt: many(testAttempt)
}));
