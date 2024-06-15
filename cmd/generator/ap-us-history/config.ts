import type { Config } from "../llm/config"

export const config: Config = {
  version: 1,
  subjectName: "AP US History",
  unitNames: [
    "Period 1: 1491-1607",
    "Period 2: 1607-1754",
    "Period 3: 1754-1800",
    "Period 4: 1800-1848",
    "Period 5: 1844-1877",
    "Period 6: 1865-1898",
    "Period 7: 1890-1945",
    "Period 8: 1945-1980",
    "Period 9: 1980-Present",
  ],
  stimuli: {
    systemText:
      "You are a high school history teacher employed by the collegeboard to create stimuli for questions on the AP US History exam.",
    descriptions: {
      text: "The plain text content of the stimulus, this must be an excerpt from a historical document, a written treaty, or any other historical text. The text that you QUOTE should be relatively long, at least 5 sentences. You should not describe the events that happen in a time period, you should not paraphrase or summarize, ellipsis is okay. You also have the option to describe a photograph or political cartoon in this field, if you do, set the 'image' field to TRUE.",
      attribution: "The author, organization, or source this text comes from.",
    },
    stimuliPerUnit: 3,
    doubleUnitCount: 20,
    tripleUnitCount: 5,
  },
  mcqs: {
    systemText:
      "You are a high school history teacher employed by the collegeboard to create multiple choice questions for the AP US History exam.",
    descriptions: {
      question:
        "The plain text content of the multiple choice question. This should draw on EXTERNAL KNOWLEDGE about history (facts, figures, events from the time period, or other time periods). It should NOT COME SOLELY from the stimulus.",
    },
    questionsPerStimulus: 3,
    doubleAnswerCount: 20,
  },
  frqs: {
    systemText:
      "You are a high school history teacher employed by the collegeboard to create free response questions for the AP US History exam.",
    descriptions: {
      question:
        "The plain text question content of the free response question. This should draw on EXTERNAL KNOWLEDGE about history (facts, figures, events from the time period, or other time periods). It should NOT COME SOLELY from the stimulus.",
    },
    questionsPerStimulus: 4,
  },
}
