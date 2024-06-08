<script lang="ts">
import * as RadioGroup from "@ui-lib/components/ui/radio-group"
import { Label } from "@ui-lib/components/ui/label"
import Question from "./question.svelte"
import pdebounce from "p-debounce"
import { api } from "@/src/api"

export let question: string
export let questionNumber: number
export let questionChoices: {
  id: number
  choice: string
}[]
export let selected: number | null

export let testAttemptId: number
export let questionId: number

const postChoice = pdebounce(() => {
  if (!selected) {
    return
  }
  api.tests.fillMCQs.mutate({
    testAttemptId: testAttemptId,
    questions: [
      {
        questionId: questionId,
        questionChoiceId: selected,
      },
    ],
  })
}, 1000)
</script>

<Question {question} {questionNumber} />
<RadioGroup.Root class="py-2 gap-0" value={selected?.toString()}>
    {#each questionChoices as choice}
        {@const uniqueId = choice.id.toString()}
        <div class="flex items-center gap-2 group hover:cursor-pointer pl-4">
            <RadioGroup.Item
                class="group-hover:outline-2 group-hover:outline-gray-900 group-hover:outline-offset-2 group-hover:outline"
                value={choice.id.toString()}
                id={uniqueId}
                on:click={() => {
                    selected = choice.id;
                    postChoice();
                }}
            />
            <Label class="w-full hover:cursor-pointer py-1" for={uniqueId}>
                {choice.choice}
            </Label>
        </div>
    {/each}
</RadioGroup.Root>
