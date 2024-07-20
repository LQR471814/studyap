<script lang="ts">
  import { params } from "svelte-spa-router";
  import { fly } from "svelte/transition";
  import CardLayout from "./card-layout/index.svelte";
  import ScrollingLayout from "./scrolling-layout/index.svelte";
  import EyeIcon from "~icons/ri/eye-line";
  import { Checkbox } from "@ui-lib/components/ui/checkbox";
  import IconButton from "@ui-lib/components/custom/icon-button.svelte";
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { type Context, contextSymbol } from "./context";

  export let corrections = false;

  let optionsExpanded = false;
  let instantFeedback = false;
  let scrollingLayout = false;

  $: testAttemptId = $params?.test_id ? Number($params.test_id) : undefined;

  const ctx = writable({
    withCorrections: corrections,
    fromTestHistory: corrections,
  }) satisfies Context;

  setContext(contextSymbol, ctx);

  $: {
    if (corrections) {
      break $;
    }
    $ctx = {
      withCorrections: instantFeedback,
      fromTestHistory: false,
    };
  }
</script>

{#if testAttemptId !== undefined}
  {#if scrollingLayout}
    <ScrollingLayout {testAttemptId} />
  {:else}
    <CardLayout {testAttemptId} />
  {/if}
{/if}

<div class="fixed bottom-8 right-8 flex gap-3">
  {#if optionsExpanded}
    {#if !corrections}
      <div class="flex gap-2 items-center" transition:fly={{ y: 10 }}>
        <Checkbox bind:checked={instantFeedback} />
        <p>Instant feedback</p>
      </div>
    {/if}

    <div class="flex gap-2 items-center" transition:fly={{ y: 10 }}>
      <Checkbox bind:checked={scrollingLayout} />
      <p>Scrolling layout</p>
    </div>
  {/if}

  <IconButton
    on:click={() => {
      optionsExpanded = !optionsExpanded;
    }}
  >
    <EyeIcon />
  </IconButton>
</div>
