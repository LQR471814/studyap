import { relations } from "drizzle-orm";
import { activeToken, frqAttempt, mcqAttempt, pendingVerification, question, questionChoice, questionFormat, questionUnit, stimulus, stimulusUnit, subject, testAttempt, testStimulus, unit, user } from "./schema";
export const activeTokenRelations = relations(activeToken, ({ one, many }) => ({
    user: one(user, {
        fields: [activeToken.userEmail],
        references: [user.email]
    })
}));
export const frqAttemptRelations = relations(frqAttempt, ({ one, many }) => ({
    testAttempt: one(testAttempt, {
        fields: [frqAttempt.testId],
        references: [testAttempt.id]
    }),
    stimulus: one(stimulus, {
        fields: [frqAttempt.stimulusId],
        references: [stimulus.id]
    }),
    question: one(question, {
        fields: [frqAttempt.questionId],
        references: [question.id]
    }),
    testStimulus: one(testStimulus, {
        fields: [frqAttempt.testId, frqAttempt.stimulusId],
        references: [testStimulus.testId, testStimulus.stimulusId]
    })
}));
export const mcqAttemptRelations = relations(mcqAttempt, ({ one, many }) => ({
    testAttempt: one(testAttempt, {
        fields: [mcqAttempt.testId],
        references: [testAttempt.id]
    }),
    stimulus: one(stimulus, {
        fields: [mcqAttempt.stimulusId],
        references: [stimulus.id]
    }),
    question: one(question, {
        fields: [mcqAttempt.questionId],
        references: [question.id]
    }),
    questionChoice: one(questionChoice, {
        fields: [mcqAttempt.response],
        references: [questionChoice.id]
    }),
    testStimulus: one(testStimulus, {
        fields: [mcqAttempt.testId, mcqAttempt.stimulusId],
        references: [testStimulus.testId, testStimulus.stimulusId]
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
    questionUnit: many(questionUnit)
}));
export const questionChoiceRelations = relations(questionChoice, ({ one, many }) => ({
    mcqAttempt: many(mcqAttempt),
    question: one(question, {
        fields: [questionChoice.questionId],
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
    frqAttempt: many(frqAttempt),
    mcqAttempt: many(mcqAttempt),
    question: many(question),
    subject: one(subject, {
        fields: [stimulus.subjectId],
        references: [subject.id]
    }),
    stimulusUnit: many(stimulusUnit),
    testStimulus: many(testStimulus)
}));
export const stimulusUnitRelations = relations(stimulusUnit, ({ one, many }) => ({
    stimulus: one(stimulus, {
        fields: [stimulusUnit.stimulusId],
        references: [stimulus.id]
    }),
    unit: one(unit, {
        fields: [stimulusUnit.unitId],
        references: [unit.id]
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
    }),
    testStimulus: many(testStimulus)
}));
export const testStimulusRelations = relations(testStimulus, ({ one, many }) => ({
    frqAttempt: many(frqAttempt),
    mcqAttempt: many(mcqAttempt),
    testAttempt: one(testAttempt, {
        fields: [testStimulus.testId],
        references: [testAttempt.id]
    }),
    stimulus: one(stimulus, {
        fields: [testStimulus.stimulusId],
        references: [stimulus.id]
    })
}));
export const unitRelations = relations(unit, ({ one, many }) => ({
    questionUnit: many(questionUnit),
    stimulusUnit: many(stimulusUnit),
    subject: one(subject, {
        fields: [unit.subjectId],
        references: [subject.id]
    })
}));
export const userRelations = relations(user, ({ one, many }) => ({
    activeToken: many(activeToken),
    testAttempt: many(testAttempt)
}));
