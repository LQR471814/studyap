<script lang="ts">
import type { Test } from "@/api/protected"
import Group from "./group.svelte"
import { fly } from "svelte/transition"
import { Button } from "@ui-lib/components/ui/button"
import { protectedApi } from "@/src/api"
import { push } from "svelte-spa-router"
import { getContext } from "svelte"
import { type Context, contextSymbol } from "./context"
import LeftIcon from "~icons/ri/arrow-left-s-line"

const ctx = getContext<Context>(contextSymbol)

export let test: Test

console.log(test)

let submitting = false
const submit = async () => {
  submitting = true
  try {
    await protectedApi.evalTest.mutate(test.id)
    push("/test_history")
  } catch (err) {
    console.error(err)
  }
  submitting = false
}
</script>

<div class="flex flex-col gap-3 p-5" in:fly={{ y: 10 }}>
  <div class="flex gap-3">
    {#if ctx.withCorrections}
      <button
        class="size-8 border-2 border-transparent hover:border-gray-900 transition-all flex rounded-lg"
        on:click={() => push("/test_history")}
      >
        <LeftIcon class="size-7 m-auto" />
      </button>
    {/if}

    <h1 class="text-2xl font-black">{test.subject.name}</h1>
  </div>

  {#each test.testStimulus as group}
    <Group {group} />
  {/each}

  {#if submitting}
    <p class="italic text-sm">This may take some time</p>
  {/if}
  <Button class="w-fit" disabled={submitting} on:click={submit}>
    {#if ctx.withCorrections}
      Resubmit Test
    {:else}
      Submit Test
    {/if}
  </Button>
</div>
