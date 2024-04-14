import { FRQ, FRQEval, MCQ, Stimulus, SubjectGenerator, Test } from "../types";
import { Subject } from "@/schema/tests";
import { generateRandomSegments, retryAsyncFn } from "@/lib/general";
import { z } from "zod";
import type OpenAI from "openai";

export function GENERIC_MCQ_INSTRUCTIONS(count: number, subject: string, unit: string) {
  return `Ask ${count} ${subject} multiple choice questions from unit "${unit}" with four answer options in the AP CollegeBoard style, including a stimulus/background scenario (the stimulus or background scenario should not include any extra instructions, it should just be the stimulus itself).`
}

export const GENERIC_MCQ_RETURNS = `Return the question in a JSON dictionary where the "stimulus" key is the stimulus for each of the questions, the "questions" key is an array of dictionaries where the "question" key is the question, the "options" key is a list of strings containing the answer options (excluding prefixes like "A." or "1."), the "answer" key pertains to the index with the right answer and the "explanation" key is a string explaining why the answer is correct.`

export const mcqGenReturns = z.object({
  stimulus: z.string(),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.number(),
    explanation: z.string(),
  })),
})

export function GENERIC_FRQ_INSTRUCTIONS(count: number, subject: string, unit: string) {
  return `Ask ${count} ${subject} free response questions in the AP Collegeboard style from unit "${unit}", including a stimulus/background scenario (the stimulus or background scenario should not include any extra instructions, it should just be the stimulus itself)`
}

export const GENERIC_FRQ_RETURNS = `Return the question in a JSON dictionary where the "stimulus" key is the stimulus for each of the questions and the "questions" key is an array of strings, with each corresponding to a question pertaining to the stimulus.`

export const frqGenReturns = z.object({
  stimulus: z.string(),
  questions: z.array(z.string())
})

export function GENERIC_FRQ_GRADING_INSTRUCTIONS(
  subject: string,
  stimulus: string,
  question: string,
  response: string,
) {
  return `Grade the following response to an AP Collegeboard free response question strictly according to the free response grading guidelines of the ${subject} exam. Return the graded result in a JSON dictionary with key "score" being a number indicating the amount of points scored; key "total" being the total number of points that could be scored; and "explanation" being the reason you scored it as such plus some improvements to the response and examples of those improvements.\n\nStimulus: ${stimulus}\n\nQuestion: ${question}\n\nResponse: ${response}`
}

export const frqGradingReturns = z.object({
  score: z.number(),
  total: z.number(),
  explanation: z.string(),
})

/**
 * A unary (single) call to openai while checking JSON.
 */
export async function llmFnCall<T extends Zod.ZodTypeAny>(
  openai: OpenAI,
  prompt: string,
  returns: T,
): Promise<Zod.TypeOf<T>> {
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt,
      }
    ]
  })

  const completion = res.choices[0].message.content
  if (!completion) {
    throw new Error("no completion.")
  }

  const content = JSON.parse(completion)
  return returns.parse(content)
}

export type GenericOptions = {
  mcqPartCountRange: [number, number]
  mcqQuestionCount: number

  frqPartCountRange: [number, number]
  frqQuestionCount: number

  units: string[]
  instructions: Partial<{
    stimulus: string
  }>
}

const GENERATOR_VERSION = 1

/**
 * Really just here as a placeholder, each subject should have their own specific prompts.
 */
export class Generic implements SubjectGenerator {
  readonly subject: Subject
  private openai: OpenAI
  private friendlySubjectName: string
  private options: GenericOptions
  private createMcq: (partCount: number) => Promise<Stimulus<MCQ>>
  private createFrq: (partCount: number) => Promise<Stimulus<FRQ>>

  constructor(openai: OpenAI, subject: Subject, friendlySubjectName: string, options: GenericOptions) {
    this.openai = openai
    this.subject = subject
    this.friendlySubjectName = friendlySubjectName
    this.options = options

    this.createMcq = retryAsyncFn(
      "generateMcq", 2,
      async (partCount: number) => {
        const unit = this.options.units[Math.floor(Math.random() * this.options.units.length)]

        const returns = await llmFnCall(
          this.openai,
          `${GENERIC_MCQ_INSTRUCTIONS(partCount, friendlySubjectName, unit)
          } ${this.options.instructions.stimulus ?? ""
          } ${GENERIC_MCQ_RETURNS}`,
          mcqGenReturns,
        )
        return {
          text: returns.stimulus,
          unit: unit,
          questions: returns.questions,
        }
      }
    )
    this.createFrq = retryAsyncFn(
      "generateFrq", 2,
      async (partCount: number) => {
        const unit = this.options.units[Math.floor(Math.random() * this.options.units.length)]

        const returns = await llmFnCall(
          this.openai,
          `${GENERIC_FRQ_INSTRUCTIONS(partCount, friendlySubjectName, unit)
          } ${this.options.instructions.stimulus ?? ""
          } ${GENERIC_FRQ_RETURNS}`,
          frqGenReturns,
        )
        return {
          text: returns.stimulus,
          unit: unit,
          questions: returns.questions.map(q => ({ question: q })),
        }
      }
    )
  }

  async generate(): Promise<Test> {
    const mcqSegments = generateRandomSegments(
      this.options.mcqQuestionCount, this.options.mcqPartCountRange
    )
    const frqSegments = generateRandomSegments(
      this.options.frqQuestionCount, this.options.frqPartCountRange
    )

    const mcqs: Stimulus<MCQ>[] = []
    const frqs: Stimulus<FRQ>[] = []
    await Promise.all(
      [
        ...mcqSegments.map(async count => {
          const res = await this.createMcq(count);
          mcqs.push(res)
        }),
        ...frqSegments.map(async count => {
          const res = await this.createFrq(count)
          frqs.push(res)
        })
      ],
    )

    return {
      subject: this.subject,
      generatorVersion: GENERATOR_VERSION,
      frqs: frqs,
      mcqs: mcqs,
    }
  }

  async evaluateFrq(frq: Stimulus<FRQ>, responses: string[]): Promise<FRQEval[]> {
    const grade = retryAsyncFn("grade frq", 2, (question: string, response: string) => {
      return llmFnCall(
        this.openai,
        GENERIC_FRQ_GRADING_INSTRUCTIONS(
          this.friendlySubjectName,
          frq.text,
          question,
          response,
        ),
        frqGradingReturns
      )
    })

    const promises: Promise<FRQEval>[] = []
    for (let i = 0; i < frq.questions.length; i++) {
        const response = responses[i]
      promises.push(grade(frq.questions[i].question, response))
    }
    return await Promise.all(promises)
  }
}
