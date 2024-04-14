<script lang="ts">
    import type { FRQ, FRQEval, Stimulus } from "@/generation/types";
    import { evaluateFrq } from "./api";
    import FRQPart from "./FRQPart.svelte";

    export let frq: Stimulus<FRQ>;
    export let testId: number;

    $: responses = new Array<string>(frq.questions.length).fill("");

    let evaluation: Promise<FRQEval[]> | undefined;
</script>

<blockquote class="px-7 py-5 italic">
    {frq.text}
</blockquote>

{#await evaluation}
    {#each frq.questions as { question }, i}
        <FRQPart
            {question}
            value={responses[i]}
            on:change={(e) => {
                responses[i] = e.detail;
            }}
        />
    {/each}
    <p class="italic">evaluating responses...</p>
{:then evaluations}
    {#each frq.questions as { question }, i}
        <FRQPart
            {question}
            value={responses[i]}
            on:change={(e) => {
                responses[i] = e.detail;
            }}
        >
            {#if evaluations !== undefined}
                <p class="pl-4 font-semibold">score: {evaluations[i].score}/{evaluations[i].total}</p>
                <p class="pl-4 font-semibold">explanation: {evaluations[i].explanation}</p>
            {/if}
        </FRQPart>
    {/each}
    <button
        class="text-blue-700 hover:underline"
        on:click={() => {
            evaluation = evaluateFrq(testId, frq, responses);
        }}
    >
        evaluate
    </button>
{:catch err}
    {#each frq.questions as { question }, i}
        <FRQPart
            {question}
            value={responses[i]}
            on:change={(e) => {
                responses[i] = e.detail;
            }}
        />
    {/each}
    <p>something went wrong! {err.message}</p>
    <button
        class="text-blue-700 hover:underline"
        on:click={() => {
            evaluation = evaluateFrq(testId, frq, responses);
        }}
    >
        evaluate
    </button>
{/await}
