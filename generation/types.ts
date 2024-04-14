import { Subject } from "@/schema/tests"

export type Test = {
  subject: Subject
  generatorVersion: number
  mcqs: Stimulus<MCQ>[]
  frqs: Stimulus<FRQ>[]
}

export type Stimulus<T extends MCQ | FRQ> = {
  unit: string
  text: string
  questions: T[]
}

export type MCQ = {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export type FRQ = {
  question: string
}

export type FRQEval = {
  score: number
  total: number
  explanation: string
}

export interface SubjectGenerator {
  readonly subject: Subject
  generate(): Promise<Test>
  evaluateFrq(frq: Stimulus<FRQ>, responses: string[]): Promise<FRQEval[]>
}

