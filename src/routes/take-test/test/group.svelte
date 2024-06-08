<script lang="ts">
import type { Test } from "@/api/tests"
import Mcq from "./mcq.svelte"
import Frq from "./frq.svelte"

export let testAttemptId: number
export let group: Test["testStimulus"][number]

$: stimulus = group.stimulus
$: style = group.frqAttempt.length > 0 ? ("frq" as const) : ("mcq" as const)
$: minQuestionNumber =
  style === "mcq"
    ? group.mcqAttempt[0].questionNumber
    : group.frqAttempt[0].questionNumber
$: maxQuestionNumber =
  style === "mcq"
    ? group.mcqAttempt[group.mcqAttempt.length - 1].questionNumber
    : group.frqAttempt[group.frqAttempt.length - 1].questionNumber
</script>

<h2 class="text-xl font-semibold">
    Questions {minQuestionNumber} - {maxQuestionNumber}
</h2>
{#if stimulus}
    <p>
        {stimulus.content}
    </p>
    <p class="italic">
        — {stimulus.attribution}
    </p>
{/if}
{#if style === "mcq"}
    {#each group.mcqAttempt as mcq}
        <Mcq
            question={mcq.question.content}
            questionId={mcq.questionId}
            questionNumber={mcq.questionNumber}
            questionChoices={mcq.question.questionChoice}
            selected={mcq.response}
            {testAttemptId}
        />
    {/each}
{:else if style === "frq"}
    {#each group.frqAttempt as frq}
        <Frq
            question={frq.question.content}
            questionId={frq.questionId}
            questionNumber={frq.questionNumber}
            response={frq.response ?? ""}
        />
    {/each}
{/if}

