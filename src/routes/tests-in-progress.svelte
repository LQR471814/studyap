<script lang="ts">
import { api } from "@/src/api"
import { format } from "date-fns"
import PlayIcon from "~icons/ri/play-mini-line"
import { push } from "svelte-spa-router"
import { fly } from "svelte/transition"

const tests = api.completeTests.listIncompleteTests.query()
</script>

<div class="flex h-full" in:fly={{ y: 10 }}>
    {#await tests}
        <p class="m-auto">Loading tests...</p>
    {:then tests}
        {#if tests.length > 0}
            <div class="flex flex-col m-auto">
                {#each tests as test}
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
                {/each}
            </div>
        {:else}
            <p class="m-auto">
                You are not taking any tests at the moment... Create a new test
                to begin!
            </p>
        {/if}
    {:catch err}
        <p class="m-auto">ERROR: {err.message}</p>
    {/await}
</div>
