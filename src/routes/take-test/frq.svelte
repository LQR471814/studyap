<script lang="ts">
  import { api } from "@/src/api";
  import Question from "./question.svelte";
  import * as TextArea from "@ui-lib/components/ui/textarea";
  import pDebounce from "p-debounce";
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "./context";
  import SvelteMarkdown from "svelte-markdown";

  const ctx = getContext<Context>(contextSymbol);

  export let question: string;
  export let questionNumber: number;
  export let response: string;
  export let scored: number | null;
  export let total: number;
  export let explanation: string | null;

  export let questionId: number;

  const save = pDebounce(async (response: string) => {
    await api.fillFRQs.mutate([
      {
        testAttemptId: ctx.testAttemptId,
        questionId,
        contents: response,
      },
    ]);
  }, 1000);

  $: save(response);
</script>

<Question {question} {questionNumber} />
<TextArea.Root placeholder="Type your response here" bind:value={response} />
{#if ctx.withCorrections}
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
