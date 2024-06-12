export type StimulusConfig = {
  /**
   * A natural language description of the role the assistant should assume when generating stimuli.
   *
   * Ex. `"You are a high school history teacher employed by the collegeboard to create stimuli for questions on the AP US History exam."`
   */
  systemText: string
  descriptions: {
    /**
     * A natural language description of how to generate the text in a stimulus.
     *
     * Ex. `"The plain text content of the stimulus, this can be an excerpt from a historical document, a written treaty, or any other historical text. THIS SHOULD NOT BE A SUMMARY. The text that you quote should be relatively long, at least 5 sentences. You also have the option to describe a photograph or political cartoon in this field, if you do, set the 'image' field to TRUE."`
     */
    text: string
    /**
     * A natural language description of how to generate the attribution for a stimulus.
     *
     * Ex. `"The author, organization, or source this text comes from."`
     */
    attribution: string
  }
  /**
   * The number of stimuli to generate per unit.
   */
  stimuliPerUnit: number
  /**
   * The number of stimuli to generate pertaining to 2 random units.
   */
  doubleUnitCount: number
  /**
   * The number of stimuli to generate pertaining to 3 random units.
   */
  tripleUnitCount: number
}

export type McqConfig = {
  /**
   * A natural language description of the role the assistant should assume when generating mcqs.
   *
   * Ex. `"You are a high school history teacher employed by the collegeboard to create multiple choice questions for the AP US History exam."`
   */
  systemText: string
  descriptions: {
    /**
     * A natural language description of how to generate the question content of the multiple choice question.
     *
     * Ex. `"The plain text question content of the multiple choice question."`
     */
    question?: string
  }
  /**
   * The number of questions to generate per stimulus.
   */
  questionsPerStimulus: number
  /**
   * The number of questions to generate with 2 answer choices.
   *
   * A random stimulus will be chosen to add the question to.
   */
  doubleAnswerCount: number
}

export type FrqConfig = {
  /**
   * A natural language description of the role the assistant should assume when generating frqs.
   *
   * Ex. `"You are a high school history teacher employed by the collegeboard to create free response questions for the AP US History exam."`
   */
  systemText: string
  descriptions: {
    /**
     * A natural language description of how to generate the question content of the free response question.
     *
     * Ex. `"The plain text question content of the free response question."`
     */
    question?: string
    /**
     * A natural language description of how to generate grading guidelines for a free response question.
     *
     * Ex.
     * ```
     * "Grading guidelines to be given to a grader on how they should score an arbitrary student response to the question.
     * Example.
     * - 1 pt for mentioning the presidential precedents set by George Washington.
     * - 1 pt for mentioning WWII
     * etc..."
     * ```
     */
    guidelines?: string
    /**
     * A natural language description of how to set the total points of the question.
     *
     * Ex. `"The total amount of points a student can earn on this question."`
     */
    totalPoints?: string
  }
  /**
   * The number of questions to generate per stimulus.
   */
  questionsPerStimulus: number
}

export type Config = {
  version: number
  subjectName: string
  unitNames: string[]
  stimuli: StimulusConfig
  mcqs: McqConfig
  frqs: FrqConfig
}
