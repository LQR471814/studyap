import { relations } from "drizzle-orm";
import { frqPart, mcq, mcqOption, stimulus, subject, test, useGenVersion } from "./tests";
export const frqPartRelations = relations(frqPart, ({ one, many }) => ({
    stimulus: one(stimulus, {
        fields: [frqPart.stimulusId],
        references: [stimulus.id]
    })
}));
export const mcqRelations = relations(mcq, ({ one, many }) => ({
    stimulus: one(stimulus, {
        fields: [mcq.stimulusId],
        references: [stimulus.id]
    }),
    mcqOption: many(mcqOption)
}));
export const mcqOptionRelations = relations(mcqOption, ({ one, many }) => ({
    mcq: one(mcq, {
        fields: [mcqOption.mcqId],
        references: [mcq.id]
    })
}));
export const stimulusRelations = relations(stimulus, ({ one, many }) => ({
    frqPart: many(frqPart),
    mcq: many(mcq),
    test: one(test, {
        fields: [stimulus.testId],
        references: [test.id]
    })
}));
export const testRelations = relations(test, ({ one, many }) => ({
    stimulus: many(stimulus)
}));
