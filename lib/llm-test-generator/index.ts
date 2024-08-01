import type { Span } from "@opentelemetry/api"
import type { LLMGeneratorConfig } from "./config"
import { z } from "zod"
import { FrqPrompts, McqPrompts, StimulusPrompts } from "./synthetic-prompts"
import { LLMJobQueue } from "./llm-job-queue"

export { Append } from "./append"
export type { LLMGeneratorConfig }
export { LLMJobQueue }

export class LLMGenerator {
  private subjectName: string
  private unitNames: string[]
  private config: LLMGeneratorConfig
  private jobQueue: LLMJobQueue

  constructor(
    subjectName: string,
    unitNames: string[],
    jobQueue: LLMJobQueue,
    config: LLMGeneratorConfig,
  ) {
    this.subjectName = subjectName
    this.unitNames = unitNames
    this.jobQueue = jobQueue
    this.config = config
  }

  stimulus(
    span: Span | undefined,
    units: {
      id: number
      name: string
    }[],
  ) {
    const stimulusObj = z.object({
      text: z.string().describe(this.config.stimuli.descriptions.text),
      attribution: z
        .string()
        .describe(this.config.stimuli.descriptions.attribution),
      image: z
        .boolean()
        .describe(
          "This should be set to TRUE if the 'text' field describes an image.",
        ),
    })

    return this.jobQueue.add(span, {
      request: {
        model: "big",
        systemText: this.config.stimuli.systemText,
        messages: [
          {
            role: "user",
            content: StimulusPrompts.instructions(units.map((u) => u.name)),
          },
          {
            role: "user",
            content: StimulusPrompts.continuation(units.map((u) => u.name)),
          },
        ],
        mustUseFunctions: true,
        functions: {
          generate_stimulus: {
            description: `Create a stimulus for the ${this.subjectName} exam.`,
            returns: stimulusObj,
          },
        },
      },
      validate(res) {
        const completion = res.returns?.generate_stimulus
        if (!completion) {
          return
        }
        return completion
      },
    })
  }

  private answerChoiceSchema = z.object({
    text: z
      .string()
      .describe(
        "A plain text potential answer pertaining to the multiple choice question.",
      ),
    correct: z
      .boolean()
      .describe(
        "A boolean that is true if this answer choice is the correct or one of the correct answer choices.",
      ),
    explanation: z
      .string()
      .describe(
        "An explanation explaining why this answer is correct or incorrect as indicated by the 'correct' field.",
      ),
  })
  mcq(
    span: Span | undefined,
    stimulus: {
      id: number
      content: string
    },
  ) {
    const questionSchema = z.object({
      question: z
        .string()
        .describe(
          this.config.mcqs.descriptions.question ??
          "The plain text question content of the multiple choice question.",
        ),
      choiceA: this.answerChoiceSchema.describe(
        "Answer choice A, this should be an object.",
      ),
      choiceB: this.answerChoiceSchema.describe(
        "Answer choice B, this should be an object.",
      ),
      choiceC: this.answerChoiceSchema.describe(
        "Answer choice C, this should be an object.",
      ),
      choiceD: this.answerChoiceSchema.describe(
        "Answer choice D, this should be an object.",
      ),
      choiceE: this.answerChoiceSchema
        .describe(
          "Answer choice E, if necessary, this should be an object if defined.",
        )
        .nullish(),
    })

    return this.jobQueue.add(span, {
      request: {
        model: "big",
        messages: [
          {
            role: "user",
            content: McqPrompts.instructions(
              this.subjectName,
              this.unitNames,
              stimulus.content,
              1,
            ),
          },
        ],
        systemText: this.config.mcqs.systemText,
        mustUseFunctions: true,
        functions: {
          generate_mcq: {
            description: `Create a multiple choice question for the ${this.subjectName} exam.`,
            returns: questionSchema,
          },
        },
      },
      validate(res) {
        const completion = res.returns?.generate_mcq
        if (!completion) {
          if (span?.isRecording()) {
            span.addEvent("got empty completion!", {
              "log.severity": "WARN",
              completion: JSON.stringify(res),
            })
          }
          return
        }

        const choices = [
          completion.choiceA,
          completion.choiceB,
          completion.choiceC,
          completion.choiceD,
          ...(completion.choiceE ? [completion.choiceE] : []),
        ]

        const correct = choices.find((c) => c.correct)
        if (!correct) {
          if (span?.isRecording()) {
            span.addEvent("no correct choice present in generated mcq.", {
              "log.severity": "WARN",
              completion: JSON.stringify(completion),
            })
          }
          return
        }

        return {
          question: completion.question,
          choices,
        }
      },
    })
  }

  frqs(
    span: Span | undefined,
    stimulus: {
      id: number
      content: string
    },
  ) {
    const questionSchema = z.object({
      question: z
        .string()
        .describe(
          this.config.frqs.descriptions.question ??
          "The plain text question content of the free response question.",
        ),
      guidelines: z
        .string()
        .describe(
          this.config.frqs.descriptions.guidelines ??
          "Grading guidelines to be given to a grader on how they should score an arbitrary student response to the question.",
        ),
      totalPoints: z
        .number()
        .describe(
          this.config.frqs.descriptions.totalPoints ??
          "The total amount of points a student can earn on this question, as specified by the 'guidelines' key.",
        ),
    })

    return this.jobQueue.add(span, {
      request: {
        model: "big",
        messages: [
          {
            role: "user",
            content: FrqPrompts.instructions(
              this.subjectName,
              this.unitNames,
              stimulus.content,
            ),
          },
        ],
        systemText: this.config.frqs.systemText,
        mustUseFunctions: true,
        functions: {
          generate_frq: {
            description: `Create a free response question for the ${this.subjectName} exam.`,
            returns: questionSchema,
          },
        },
      },
      validate(res) {
        const completion = res.returns?.generate_frq
        if (!completion) {
          if (span?.isRecording()) {
            span.addEvent("got empty completion!", {
              "log.severity": "WARN",
              completion: JSON.stringify(res),
            })
          }
          return
        }
        return completion
      },
    })
  }
}
