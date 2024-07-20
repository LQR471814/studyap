<script lang="ts">
  import { protectedApi } from "@/src/api";
  import { Label } from "@ui-lib/components/ui/label";
  import * as RadioGroup from "@ui-lib/components/ui/radio-group";
  import pdebounce from "p-debounce";
  import { createEventDispatcher, getContext } from "svelte";
  import { twMerge } from "tailwind-merge";
  import { type Context, contextSymbol } from "../context";
  import Question from "../shared/question.svelte";
  import { heuristicUnescape } from "@/lib/utils";
  import { writable } from "@macfja/svelte-persistent-store";

  const ctx = getContext<Context>(contextSymbol);

  export let question: string;
  export let questionNumber: number;
  export let questionChoices: {
    id: number;
    choice: string;
    correct: boolean;
    explanation: string | null;
  }[];
  export let selected: number | null;
  export let questionId: number;
  export let testAttemptId: number;

  const value = writable(`mcq:${testAttemptId}.${questionId}`, selected);

  const dispatcher = createEventDispatcher<{ select: number }>();

  const postChoice = pdebounce((response: number | null) => {
    if (response === null) {
      return;
    }
    protectedApi.fillMCQs.mutate({
      testAttemptId: testAttemptId,
      questions: [
        {
          questionId: questionId,
          questionChoiceId: response,
        },
      ],
    });
  }, 1000);
  $: postChoice($value)
</script>

<Question {question} {questionNumber} />

<RadioGroup.Root class="py-2 gap-0" value={$value?.toString()}>
  {#each questionChoices as choice}
    {@const uniqueId = choice.id.toString()}

    <div
      class={twMerge(
        "flex items-center gap-2 pl-4",
        $ctx.withCorrections
          ? choice.id === $value
            ? choice.correct
              ? "text-green-700"
              : "text-red-700"
            : ""
          : "",
      )}
    >
      <RadioGroup.Item
        class="hover:outline-1 hover:outline-gray-900 hover:outline-offset-2 hover:outline text-current"
        value={choice.id.toString()}
        id={uniqueId}
        on:click={() => {
          $value = choice.id;
          dispatcher("select", choice.id);
        }}
      />

      <Label class="w-full hover:cursor-pointer py-1" for={uniqueId}>
        {heuristicUnescape(choice.choice)}
      </Label>

      {#if $ctx.withCorrections && choice.id === $value}
        {#if choice.correct}
          <p class="text-green-700">✓</p>
        {:else}
          <p class="text-red-700">✗</p>
        {/if}
      {/if}
    </div>

    {#if $ctx.withCorrections && choice.explanation && $value !== null}
      <p
        class={twMerge(
          choice.correct ? "text-green-700" : "text-red-700",
          "ml-10 my-2 text-sm glass-panel p-2",
        )}
      >
        {choice.explanation}
      </p>
    {/if}
  {/each}
</RadioGroup.Root>
