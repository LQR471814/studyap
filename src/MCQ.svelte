<script lang="ts">
    import type { MCQ, Stimulus } from "@/generation/types";
    import { formatMCQOption } from "@/lib/general";
    import MCQPart from "./MCQPart.svelte"

    export let stimulus: Stimulus<MCQ>;
</script>

<div>
    <blockquote class="px-7 py-5 italic">
        {stimulus.text}
    </blockquote>

    {#each stimulus.questions as mcq, i}
        <MCQPart {mcq} />
    {/each}
</div>

