<script lang="ts">
import type { Test } from "@/api/router"
import Group from "./group.svelte"
import { fly } from "svelte/transition"
import { Button } from "@ui-lib/components/ui/button"
import { api } from "@/src/api"
import { push } from "svelte-spa-router"
import { getContext } from "svelte"
import { type Context, contextSymbol } from "./context"

const ctx = getContext<Context>(contextSymbol)

export let test: Test

console.log(test)

let submitting = false
const submit = async () => {
  submitting = true
  try {
    await api.evalTest.mutate(test.id)
    push("/test_history")
  } catch (err) {
    console.error(err)
  }
  submitting = false
}
</script>

<div class="flex flex-col gap-3 p-5" in:fly={{ y: 10 }}>
  <h1 class="text-2xl font-black">{test.subject.name}</h1>

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
