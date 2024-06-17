<script lang="ts">
  import type { Test } from "@/api/protected";
  import Mcq from "./mcq.svelte";
  import Frq from "./frq.svelte";
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "./context";
  import { twMerge } from "tailwind-merge";
  import { heuristicUnescape } from "@/lib/utils";

  const ctx = getContext<Context>(contextSymbol);

  export let group: Test["testStimulus"][number];

  $: stimulus = group.stimulus;
  $: style = group.frqAttempt.length > 0 ? ("frq" as const) : ("mcq" as const);
  $: minQuestionNumber =
    style === "mcq"
      ? group.mcqAttempt[0].questionNumber
      : group.frqAttempt[0].questionNumber;
  $: maxQuestionNumber =
    style === "mcq"
      ? group.mcqAttempt[group.mcqAttempt.length - 1].questionNumber
      : group.frqAttempt[group.frqAttempt.length - 1].questionNumber;

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

<h2 class="flex justify-between text-xl font-semibold">
  <span>
    Questions {minQuestionNumber} - {maxQuestionNumber}
  </span>
  {#if ctx.withCorrections}
    <code
      class={twMerge(
        "font-normal",
        groupScored !== undefined
          ? groupScored >= groupTotal
            ? "text-green-700"
            : "text-red-700"
          : "",
      )}>{groupScored}/{groupTotal}</code
    >
  {/if}
</h2>
{#if stimulus.content}
  <p>
    {heuristicUnescape(stimulus.content)}
  </p>
  {#if stimulus.attribution}
    <p class="italic">
      — {heuristicUnescape(stimulus.attribution)}
    </p>
  {/if}
{/if}
{#if style === "mcq"}
  {#each group.mcqAttempt as mcq}
    <Mcq
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
