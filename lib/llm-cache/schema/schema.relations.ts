import { relations } from "drizzle-orm";
import { completion, completionFunctionCall } from "./schema";
export const completionRelations = relations(completion, ({ one, many }) => ({
    completionFunctionCall: many(completionFunctionCall)
}));
export const completionFunctionCallRelations = relations(completionFunctionCall, ({ one, many }) => ({
    completion: one(completion, {
        fields: [completionFunctionCall.completionId],
        references: [completion.id]
    })
}));
