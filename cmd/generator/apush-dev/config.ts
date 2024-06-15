import { config as original } from "../ap-us-history/config"
import type { Config } from "../llm/config"

export const config: Config = {
  version: original.version,
  subjectName: original.subjectName,
  unitNames: [
    "Period 1: 1491-1607",
    "Period 2: 1607-1754",
    "Period 3: 1754-1800",
  ],
  stimuli: {
    ...original.stimuli,
    stimuliPerUnit: 1,
    doubleUnitCount: 0,
    tripleUnitCount: 0,
  },
  mcqs: {
    ...original.mcqs,
    questionsPerStimulus: 1,
    doubleAnswerCount: 1,
  },
  frqs: {
    ...original.frqs,
    questionsPerStimulus: 1,
  },
}
