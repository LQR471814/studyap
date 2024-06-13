<script lang="ts">
// import ScoreIcon from "~icons/ri/graduation-cap-line"
// import CheckIcon from "~icons/ri/check-fill"
// import BookIcon from "~icons/ri/book-open-line"
// import StatisticCard from "@ui-lib/components/custom/statistic-card.svelte"
import { format } from "date-fns"
import { fly } from "svelte/transition"
import { protectedApi } from "@/src/api"
import * as Table from "@ui-lib/components/ui/table"
import { push } from "svelte-spa-router"
import { createQuery } from "@tanstack/svelte-query"
import * as AlertDialog from "@ui-lib/components/ui/alert-dialog"
import { twMerge } from "tailwind-merge"
import TrashIcon from "~icons/ri/delete-bin-5-line"
import EyeIcon from "~icons/ri/eye-line"

const complete = createQuery({
  queryKey: ["test-history"],
  queryFn: () => protectedApi.listCompleteTests.query(),
})

let deleting = false

const deleteTest = (testId: number) => {
  deleting = true
  protectedApi.deleteTest
    .mutate(testId)
    .then(() => {
      deleting = false
      $complete.refetch()
    })
    .catch((err) => {
      console.error(err)
    })
}
</script>

<div class="flex flex-col gap-10 p-5" in:fly={{ y: 10 }}>
  {#if $complete.isLoading}
    <p class="m-auto">Loading...</p>
  {:else if $complete.isError}
    <p class="m-auto">Error: {$complete.error.message}</p>
  {:else if $complete.isSuccess}
    <div class="flex flex-col gap-5">
      <h1 class="text-2xl font-semibold">Past Tests</h1>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="min-w-[5%]"></Table.Head>
            <Table.Head class="min-w-[30%]">Subject</Table.Head>
            <Table.Head class="min-w-[20%]">Date</Table.Head>
            <Table.Head class="min-w-[20%]">Multiple choice %</Table.Head>
            <Table.Head class="min-w-[20%]">Free response %</Table.Head>
            <Table.Head class="min-w-[5%]"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each $complete.data as attempt}
            <Table.Row>
              <Table.Cell class="py-3">
                <button
                  class={twMerge(
                    "border-transparent border-2 hover:border-current",
                    "transition-all size-8 flex rounded-lg",
                  )}
                  on:click={() => {
                    push(`/test_history/${attempt.id}`);
                  }}
                >
                  <EyeIcon class="m-auto" />
                </button>
              </Table.Cell>

              <Table.Cell class="py-3">{attempt.subjectName}</Table.Cell>
              <Table.Cell>
                {format(attempt.createdAt, "M / d / yyyy")}
              </Table.Cell>
              <Table.Cell>
                {Math.round((attempt.scoredMcq / attempt.totalMcq) * 100)}%
              </Table.Cell>
              <Table.Cell>
                {Math.round((attempt.scoredFrq / attempt.totalFrq) * 100)}%
              </Table.Cell>

              <Table.Cell>
                <AlertDialog.Root>
                  <AlertDialog.Trigger class="px-3">
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
                        Are you sure you want to delete this completed test?
                      </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                      <AlertDialog.Action
                        on:click={(e) => {
                          e.preventDefault();
                          deleteTest(attempt.id);
                        }}
                        disabled={deleting}
                      >
                        Delete
                      </AlertDialog.Action>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}
</div>

<!-- <div class="flex gap-5"> -->
<!--     <div class="flex gap-10 justify-evenly w-full py-3 px-12"> -->
<!--         <StatisticCard -->
<!--             label="Average Score" -->
<!--             number={4.25} -->
<!--             changeDirection="up" -->
<!--             change="16% this month" -->
<!--         > -->
<!--             <ScoreIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--         <StatisticCard -->
<!--             label="Tests Completed" -->
<!--             number={23} -->
<!--             changeDirection="down" -->
<!--             change="1% this month" -->
<!--         > -->
<!--             <CheckIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--         <StatisticCard label="Available Tests" number={250}> -->
<!--             <BookIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--     </div> -->
<!-- </div> -->
