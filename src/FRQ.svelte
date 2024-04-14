<script lang="ts">
    import type { FRQ, Stimulus } from "@/generation/types";

    export let frq: Stimulus<FRQ>;
</script>

<blockquote class="px-7 py-5 italic">
    {frq.text}
</blockquote>

{#each frq.questions as { question }}
    <div>
        <p>{question}</p>
        <textarea placeholder="answer here..."></textarea>
    </div>
{/each}
