<script lang="ts">
import { api } from "@/src/api"
import Question from "./question.svelte"
import * as TextArea from "@ui-lib/components/ui/textarea"
import pDebounce from "p-debounce"

export let question: string
export let questionNumber: number
export let response: string

export let questionId: number

const save = pDebounce(async (response: string) => {
  await api.tests.fillFRQs.mutate([
    {
      questionId,
      contents: response,
    },
  ])
}, 1000)

$: save(response)
</script>

<Question {question} {questionNumber} />
<TextArea.Root placeholder="Type your response here" bind:value={response} />

