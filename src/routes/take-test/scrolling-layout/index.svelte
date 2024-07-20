<script lang="ts">
  import Group from "./group.svelte";
  import { fly } from "svelte/transition";
  import { Button } from "@ui-lib/components/ui/button";
  import { protectedApi } from "@/src/api";
  import { push } from "svelte-spa-router";
  import { createQuery } from "@tanstack/svelte-query";
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "../context";
  import TestHeader from "../shared/test-header.svelte";

  export let testAttemptId: number;

  const ctx = getContext<Context>(contextSymbol);

  const test = createQuery({
    queryKey: ["getTest", testAttemptId],
    queryFn: () => {
      return protectedApi.getTest.query(testAttemptId);
    },
  });

  let submitting = false;
  $: submit = async () => {
    if (!$test.data) {
      return;
    }

    submitting = true;
    try {
      await protectedApi.evalTest.mutate($test.data.id);
      push("/test_history");
    } catch (err) {
      console.error(err);
    }
    submitting = false;
  };
</script>

{#if $test.data}
  <div class="flex flex-col gap-3 p-5" in:fly={{ y: 10 }}>
    <TestHeader testName={$test.data.subject.name} />

    {#each $test.data.testStimulus as group}
      <Group {group} />
    {/each}

    {#if submitting}
      <p class="italic text-sm">This may take some time</p>
    {/if}
    {#if !$ctx.withCorrections}
      <Button class="w-fit" disabled={submitting} on:click={submit}>
        Submit Test
      </Button>
    {/if}
  </div>
{:else if $test.isError}
  <div class="flex h-full">
    <p class="m-auto">ERROR: {$test.error.message}</p>
  </div>
{:else if $test.isPending}
  <div class="flex h-full">
    <p class="m-auto">Loading...</p>
  </div>
{/if}
