<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getTest } from "./api";
    import MCQ from "./MCQ.svelte";
    import FRQ from "./FRQ.svelte";

    export let id: number;

    const dispatcher = createEventDispatcher<{
        close: void;
    }>();

    const test = getTest(id);
</script>

<button
    class="text-blue-700 hover:underline block"
    on:click={() => dispatcher("close")}
>
    &lt; Go back
</button>

{#await test then test}
    <div class="flex flex-col gap-3">
        <h1 class="text-xl font-bold">{test.subject}</h1>

        <h2 class="text-md font-bold italic">Multiple Choice</h2>
        {#each test.mcqs as mcq, i}
            <MCQ stimulus={mcq} />
            {#if i !== test.mcqs.length - 1}
                <hr class="border-black" />
            {/if}
        {/each}

        <h2 class="text-md font-bold italic">Free Response</h2>
        {#each test.frqs as frq, i}
            <FRQ {frq} testId={id} />
            {#if i !== test.mcqs.length - 1}
                <hr class="border-black" />
            {/if}
        {/each}
    </div>
{:catch err}
    {err.message}
{/await}
