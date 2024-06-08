export type Function<R extends Zod.ZodTypeAny> = {
  description?: string
  returns: R
}
export type FunctionDefs = Record<string, Function<Zod.ZodTypeAny>>

export type MessageRole = "assistant" | "user"
export type Message = {
  role: MessageRole
  content: string
}
export type ModelType = "big" | "small"

export type GenerateRequest<F extends FunctionDefs> = {
  model: ModelType
  systemText?: string
  messages: Message[]
  functions: F
}
export type GenerateResult<F extends FunctionDefs> = {
  text: string
  returns?: { [key in keyof F]?: Zod.TypeOf<F[key]["returns"]> }
}

/**
 * An abstract layer over an LLM-providing service.
 *
 * Langchain is over-kill and probably over-abstraction.
 */
export interface LLM {
  generate<F extends FunctionDefs>(
    options: GenerateRequest<F>,
  ): Promise<GenerateResult<F>>
}
