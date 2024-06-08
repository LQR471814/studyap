<script lang="ts">
import type { Test } from "@/api/tests"
import Group from "./group.svelte"
import { fly } from "svelte/transition"
import { Button } from "@ui-lib/components/ui/button"
import { api } from "@/src/api"
import { push } from "svelte-spa-router"

export let test: Test

let submitting = false
const submit = async () => {
  submitting = true
  try {
    await api.tests.evalTest.mutate(test.id)
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
        <Group {group} testAttemptId={test.id} />
    {/each}

    <Button class="w-fit" disabled={submitting} on:click={submit}>
        Submit Test
    </Button>
    {#if submitting}
      <p class="italic text-sm">This may take some time</p>
    {/if}
</div>
