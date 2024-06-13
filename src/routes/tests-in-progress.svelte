<script lang="ts">
import { protectedApi } from "@/src/api"
import { format } from "date-fns"
import PlayIcon from "~icons/ri/play-mini-line"
import TrashIcon from "~icons/ri/delete-bin-5-line"
import { push } from "svelte-spa-router"
import { fly } from "svelte/transition"
import * as AlertDialog from "@ui-lib/components/ui/alert-dialog"
import { twMerge } from "tailwind-merge"
import { createQuery } from "@tanstack/svelte-query"

const tests = createQuery({
  queryKey: ["tests-in-progress"],
  queryFn: () => protectedApi.listIncompleteTests.query(),
})

let deleting = false

const deleteTest = (testId: number) => {
  deleting = true
  protectedApi.deleteTest
    .mutate(testId)
    .then(() => {
      deleting = false
      $tests.refetch()
    })
    .catch((err) => {
      console.error(err)
    })
}
</script>

<div class="flex h-full" in:fly={{ y: 10 }}>
  {#if $tests.isLoading}
    <p class="m-auto">Loading tests...</p>
  {:else if $tests.isError}
    <p class="m-auto">ERROR: {$tests.error.message}</p>
  {:else if $tests.isSuccess}
    {#if $tests.data.length > 0}
      <div class="flex flex-col m-auto">
        {#each $tests.data as test}
          <div class="flex items-center">
            <button
              class="flex gap-2 p-1 rounded-lg border-transparent border-2 hover:border-gray-900 transition-all"
              on:click={() => push(`/take_test/${test.id}`)}
            >
              <PlayIcon />
              <p class="font-medium">{test.subjectName}</p>
              <p class="mr-1 font-medium">
                {format(test.createdAt, "M / d / yyyy")}
              </p>
            </button>

            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <button
                  class={twMerge(
                    "hover:text-red-700 border-transparent border-2 hover:border-current",
                    "transition-all size-8 flex rounded-lg",
                  )}
                >
                  <TrashIcon class="m-auto" />
                </button>
              </AlertDialog.Trigger>

              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Delete test?</AlertDialog.Title>
                  <AlertDialog.Description>
                    Are you sure you want to delete this test that is still in
                    progress?
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                  <AlertDialog.Action
                    on:click={(e) => {
                      e.preventDefault();
                      deleteTest(test.id);
                    }}
                    disabled={deleting}
                  >
                    Delete
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </div>
        {/each}
      </div>
    {:else}
      <p class="m-auto">
        You are not taking any tests at the moment... Create a new test to
        begin!
      </p>
    {/if}
  {/if}
</div>
