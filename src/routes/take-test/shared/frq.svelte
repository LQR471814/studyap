<script lang="ts">
  import { protectedApi } from "@/src/api";
  import Question from "../shared/question.svelte";
  import * as TextArea from "@ui-lib/components/ui/textarea";
  import pDebounce from "p-debounce";
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "../context";
  import SvelteMarkdown from "svelte-markdown";
  import { writable } from "@macfja/svelte-persistent-store";
  import { Button } from "@ui-lib/components/ui/button";
  import { createMutation } from "@tanstack/svelte-query";

  const ctx = getContext<Context>(contextSymbol);

  export let question: string;
  export let questionNumber: number;
  export let response: string;
  export let scored: number | null;
  export let total: number;
  export let explanation: string | null;

  export let testAttemptId: number;
  export let questionId: number;

  const value = writable(`frq:${testAttemptId}.${questionId}`, response);

  $: regrade = createMutation({
    mutationKey: ["evalSingleFRQ", testAttemptId, questionId],
    mutationFn: () =>
      protectedApi.evalSingleFRQ.mutate({
        testId: testAttemptId,
        questionId,
      }),
  });

  const save = pDebounce(async (response: string) => {
    await protectedApi.fillFRQs.mutate([
      {
        testAttemptId,
        questionId,
        contents: response,
      },
    ]);
  }, 1000);
  $: save($value);
</script>

<Question {question} {questionNumber} />

<TextArea.Root
  placeholder="Type your response here"
  value={$value}
  on:keydown={(e) => {
    e.stopPropagation();
  }}
  on:input={(e) => {
    $value = e.currentTarget.value;
  }}
/>

{#if $ctx.withCorrections && response}
  <div class="glass-panel text-sm">
    {#if explanation}
      <p
        class={scored !== null
          ? scored >= total
            ? "text-green-700"
            : "text-red-700"
          : ""}
      >
        Scored <code class="font-normal">{scored ?? "—"}/{total}</code> pts.
      </p>
      <SvelteMarkdown source={explanation} />
    {:else}
      <p>No explanation for scoring provided...</p>
    {/if}
  </div>
{/if}

{#if $ctx.withCorrections}
  <Button
    class="flex gap-2 w-fit"
    disabled={$regrade.isPending}
    on:click={() => {
      if ($regrade.isPending) {
        return;
      }
      $regrade.mutate();
    }}
  >
    {#if $regrade.isPending}
      Grading in progress...
    {:else if $regrade.isError}
      Error: {$regrade.error.message}
    {:else}
      Re-grade
    {/if}
  </Button>
{/if}
