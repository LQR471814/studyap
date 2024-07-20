<script lang="ts">
  import { getContext } from "svelte";
  import { type Context, contextSymbol } from "../context";
  import LeftIcon from "~icons/ri/arrow-left-s-line";
  import { push } from "svelte-spa-router";

  const ctx = getContext<Context>(contextSymbol);

  export let testName: string;
</script>

<div class="flex gap-3">
  {#if $ctx.fromTestHistory}
    <button
      class="size-8 border-2 border-transparent hover:border-gray-900 transition-all flex rounded-lg"
      on:click={() => push("/test_history")}
    >
      <LeftIcon class="size-7 m-auto" />
    </button>
  {/if}

  <h1 class="text-2xl font-black">{testName}</h1>
</div>
