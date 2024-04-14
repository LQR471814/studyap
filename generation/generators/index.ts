import { USHistory } from "./ushistory";
import OpenAI from "openai";

export function generators(openai: OpenAI) {
  return [
    new USHistory(openai)
  ]
}

