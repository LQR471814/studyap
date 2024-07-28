<script lang="ts">
  import { fly } from "svelte/transition";
  import Mcq from "./mcq.svelte";
  import Frq from "./frq.svelte";
  import RightArrowIcon from "~icons/ri/arrow-right-s-line";
  import IconButton from "@ui-lib/components/custom/icon-button.svelte";
  import { protectedApi } from "@/src/api";
  import { push } from "svelte-spa-router";
  import { Button } from "@ui-lib/components/ui/button";
  import { getContext, onDestroy } from "svelte";
  import { type Context, contextSymbol } from "../context";
  import { createQuery } from "@tanstack/svelte-query";
  import Group from "./group.svelte";
  import TestHeader from "../shared/test-header.svelte";

  const ctx = getContext<Context>(contextSymbol);

  export let testAttemptId: number;

  let showAnswer = false;
  let questionNumber = 1;

  $: groupList = createQuery({
    queryKey: ["listGroups", testAttemptId],
    queryFn: () => protectedApi.listGroups.query(testAttemptId),
  });

  $: {
    if (!$groupList.data) {
      break $;
    }
    for (const group of $groupList.data) {
      console.log("prefetch group", group.stimulusId);
      createQuery({
        queryKey: ["getGroup", group.stimulusId],
        queryFn: () =>
          protectedApi.getGroup.query({
            testAttemptId,
            stimulusId: group.stimulusId,
          }),
      });
    }
  }

  $: question = createQuery({
    queryKey: ["getQuestionAttempt", testAttemptId, questionNumber],
    queryFn: () =>
      protectedApi.getQuestionAttempt.query({
        testAttemptId,
        questionNumber,
      }),
  });

  $: questionUnion = $question.data?.frq ?? $question.data?.mcq;

  $: lastQuestionNumber = createQuery({
    queryKey: ["getLastQuestion", testAttemptId],
    queryFn: () => protectedApi.getLastQuestion.query(testAttemptId),
  });

  $: {
    if (!$lastQuestionNumber.data) {
      break $;
    }
    for (let i = 1; i <= $lastQuestionNumber.data; i++) {
      console.log("prefetch question", i);
      createQuery({
        queryKey: ["getQuestionAttempt", testAttemptId, i],
        queryFn: () =>
          protectedApi.getQuestionAttempt.query({
            testAttemptId,
            questionNumber: i,
          }),
      });
    }
  }

  $: previous = () => {
    if (questionNumber <= 1) {
      return;
    }
    questionNumber--;
  };
  $: next = () => {
    if (!$lastQuestionNumber.data) {
      return;
    }
    if (questionNumber >= $lastQuestionNumber.data) {
      return;
    }
    questionNumber++;
  };

  const keyhandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      previous();
    }
    if (e.key === "ArrowRight") {
      next();
    }
  };
  window.addEventListener("keydown", keyhandler);
  onDestroy(() => window.removeEventListener("keydown", keyhandler));

  $: testName = createQuery({
    queryKey: ["getTestName", testAttemptId],
    queryFn: () => protectedApi.getTestName.query(testAttemptId),
  });

  let submitting = false;
  const submit = async () => {
    submitting = true;
    try {
      await protectedApi.evalTest.mutate(testAttemptId);
      push("/test_history");
    } catch (err) {
      console.error(err);
    }
    submitting = false;
  };
</script>

<div class="flex flex-col gap-3 p-5" in:fly={{ y: 10 }}>
  <TestHeader testName={$testName.data ?? ""} />

  {#if questionUnion && $lastQuestionNumber.data !== undefined}
    <Group
      {testAttemptId}
      stimulusId={questionUnion.stimulusId}
      lastQuestionNumber={$lastQuestionNumber.data}
    />
  {/if}

  <!-- this is here for spacing -->
  <div />

  {#if $question.data?.frq}
    <Frq frq={$question.data.frq} />
  {:else if $question.data?.mcq}
    <Mcq mcq={$question.data.mcq} {showAnswer} />
  {:else}
    <p>Loading question details...</p>
  {/if}

  <div class="flex gap-5 items-center">
    <div class="flex gap-1">
      <IconButton disabled={questionNumber <= 1} on:click={previous}>
        <RightArrowIcon class="rotate-180" />
      </IconButton>
      <IconButton
        disabled={$lastQuestionNumber.data !== undefined
          ? questionNumber >= $lastQuestionNumber.data
          : true}
        on:click={next}
      >
        <RightArrowIcon />
      </IconButton>
    </div>
    {#if ctx}
      {#if submitting}
        <p class="italic text-sm">This may take some time</p>
      {/if}

      {#if !$ctx.withCorrections}
        <Button class="w-fit" on:click={() => (showAnswer = !showAnswer)}>
          {#if !showAnswer}
            Show Answers
          {:else}
            Hide Answers
          {/if}
        </Button>
      {/if}

      {#if !$ctx.withCorrections}
        <Button class="w-fit" disabled={submitting} on:click={submit}>
          Submit Test
        </Button>
      {/if}
    {/if}
  </div>
</div>
