<script lang="ts">
  import type { Test } from "@/api/protected";
  import Mcq from "../shared/mcq.svelte";
  import Frq from "../shared/frq.svelte";
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "../context";
  import { twMerge } from "tailwind-merge";
  import Stimulus from "../shared/stimulus.svelte";
  import GroupQuestionHeader from "./group-question-header.svelte";

  const ctx = getContext<Context>(contextSymbol);

  export let group: Test["testStimulus"][number];

  $: stimulus = group.stimulus;
  $: style = group.frqAttempt.length > 0 ? ("frq" as const) : ("mcq" as const);

  let groupScored: number | undefined;
  let groupTotal = 0;
  $: {
    if (!ctx.withCorrections) {
      break $;
    }
    if (style === "mcq") {
      groupScored = 0;
      for (const attempt of group.mcqAttempt) {
        groupScored += attempt.scoredPoints ?? 0;
        groupTotal += attempt.question.totalPoints;
      }
      break $;
    }
    if (style === "frq") {
      groupScored = 0;
      for (const attempt of group.frqAttempt) {
        groupScored += attempt.scoredPoints ?? 0;
        groupTotal += attempt.question.totalPoints;
      }
      break $;
    }
  }
</script>

<GroupQuestionHeader {group} />
{#if ctx.withCorrections}
  <code
    class={twMerge(
      "font-normal",
      groupScored !== undefined
        ? groupScored >= groupTotal
          ? "text-green-700"
          : "text-red-700"
        : "",
    )}
  >
    {groupScored}/{groupTotal}
  </code>
{/if}

{#if stimulus.content}
  <Stimulus {stimulus} />
{/if}
{#if style === "mcq"}
  {#each group.mcqAttempt as mcq}
    <Mcq
      testAttemptId={mcq.testId}
      question={mcq.question.content}
      questionId={mcq.questionId}
      questionNumber={mcq.questionNumber}
      questionChoices={mcq.question.questionChoice}
      selected={mcq.response}
    />
  {/each}
{:else if style === "frq"}
  {#each group.frqAttempt as frq}
    <Frq
      testAttemptId={frq.testId}
      question={frq.question.content}
      questionId={frq.questionId}
      questionNumber={frq.questionNumber}
      response={frq.response ?? ""}
      scored={frq.scoredPoints}
      total={frq.question.totalPoints}
      explanation={frq.scoringNotes}
    />
  {/each}
{/if}
