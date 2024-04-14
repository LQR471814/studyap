import { Generic } from "./generic";

const STIMULUS_INSTRUCTIONS = `For stimulus generation, you should abide the following rules: 1. DO NOT generate any questions or answers, this should just be an excerpt from a historical document. 2. DO NOT prepend your own contextualization to the historical document, keep it as is. 3. DO CITE the author and date of the historical document at the end of the excerpt.`

const UNITS = [
  "Period 1",
  "Period 2",
  "Period 3",
  "Period 4",
  "Period 5",
  "Period 6",
  "Period 7",
  "Period 8",
  "Period 9",
]

export class USHistory extends Generic {
  constructor() {
    super("ap_us_history", "AP US History", {
      units: UNITS,
      mcqQuestionCount: 5,
      frqQuestionCount: 2,
      instructions: {
        stimulus: STIMULUS_INSTRUCTIONS,
      }
    })
  }
}

