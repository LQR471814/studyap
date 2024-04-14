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
    <h1 class="text-xl font-bold">{test.subject}</h1>

    <h2 class="text-md font-bold italic my-2">Multiple Choice</h2>
    {#each test.mcqs as mcq}
        <MCQ {mcq} />
    {/each}

    <h2 class="text-md font-bold italic my-2">Free Response</h2>
    {#each test.frqs as frq}
        <FRQ {frq} />
    {/each}
{:catch err}
    {err.message}
{/await}
