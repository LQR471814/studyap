<script lang="ts">
import ScoreIcon from "~icons/ri/graduation-cap-line"
import CheckIcon from "~icons/ri/check-fill"
import BookIcon from "~icons/ri/book-open-line"
import StatisticCard from "@ui-lib/components/custom/statistic-card.svelte"
import { format } from "date-fns"
import { fly } from "svelte/transition"
import { api } from "@/src/api"
import * as Table from "@ui-lib/components/ui/table"
import { push } from "svelte-spa-router"

const complete = api.listCompleteTests.query()
</script>

<div class="flex flex-col gap-10 p-5" in:fly={{ y: 10 }}>
    {#await complete}
        <p class="m-auto">Loading...</p>
    {:then completed}
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

        <div class="flex flex-col gap-5">
            <h1 class="text-2xl">Past Tests</h1>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Subject</Table.Head>
                        <Table.Head>Date</Table.Head>
                        <Table.Head>Multiple choice %</Table.Head>
                        <Table.Head>Free response %</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {#each completed as attempt}
                        <Table.Row
                            class="hover:cursor-pointer hover:bg-gray-200"
                            on:click={() => {
                                push(`/test_history/${attempt.id}`);
                            }}
                        >
                            <Table.Cell class="py-3"
                                >{attempt.subjectName}</Table.Cell
                            >
                            <Table.Cell>
                                {format(attempt.createdAt, "M / d / yyyy")}
                            </Table.Cell>
                            <Table.Cell>
                                {Math.round(
                                    (attempt.scoredMcq / attempt.totalMcq) *
                                        100,
                                )}%
                            </Table.Cell>
                            <Table.Cell>
                                {Math.round(
                                    (attempt.scoredFrq / attempt.totalFrq) *
                                        100,
                                )}%
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                </Table.Body>
            </Table.Root>
        </div>
    {:catch err}
        <p class="m-auto">Error: {err.message}</p>
    {/await}
</div>
