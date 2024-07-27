<script lang="ts">
  import { format } from "date-fns";
  import * as Table from "@ui-lib/components/ui/table";
  import { push } from "svelte-spa-router";
  import { createQuery, createMutation } from "@tanstack/svelte-query";
  import * as AlertDialog from "@ui-lib/components/ui/alert-dialog";
  import { twMerge } from "tailwind-merge";
  import TrashIcon from "~icons/ri/delete-bin-5-line";
  import EyeIcon from "~icons/ri/eye-line";
  import { protectedApi } from "@/src/api";

  export let className = "";

  const complete = createQuery({
    queryKey: ["listCompleteTests"],
    queryFn: () => protectedApi.listCompleteTests.query(),
  });

  const deleteTest = createMutation({
    mutationFn: (testId: number) => protectedApi.deleteTest.mutate(testId),
  });
</script>

<div class={twMerge("flex flex-col gap-5", className)}>
  {#if $complete.isLoading}
    <p class="m-auto">Loading...</p>
  {:else if $complete.isError}
    <p class="m-auto">Error: {$complete.error.message}</p>
  {:else if $complete.isSuccess}
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
          {@const scoredMcq = attempt.scoredMcq ?? 0}
          {@const totalMcq = attempt.totalMcq ?? 0}
          {@const mcqScore =
            totalMcq === 0
              ? `No multiple-choice questions present`
              : `${Math.round((scoredMcq / totalMcq) * 100)}%`}

          {@const scoredFrq = attempt.scoredFrq ?? 0}
          {@const totalFrq = attempt.totalFrq ?? 0}
          {@const frqScore =
            totalFrq === 0
              ? `No free-response questions present`
              : `${Math.round((scoredFrq / totalFrq) * 100)}%`}

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
              {mcqScore}
            </Table.Cell>
            <Table.Cell>
              {frqScore}
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
                        $deleteTest.mutate(attempt.id);
                      }}
                      disabled={$deleteTest.isPending}
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
  {/if}
</div>
