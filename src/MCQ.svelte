<script lang="ts">
    import type { MCQ, Stimulus } from "@/generation/types";
    import { formatMCQOption } from "@/lib/general";

    export let mcq: Stimulus<MCQ>;
</script>

<blockquote class="px-7 py-5 italic">
    {mcq.text}
</blockquote>

{#each mcq.questions as { question, options }, i}
    <div>
        <p>{question}</p>
        <ol>
            {#each options as option, i}
                <li class="pl-5">
                    <button class="hover:underline">
                        {formatMCQOption(i, option)}
                    </button>
                </li>
            {/each}
        </ol>
    </div>
{/each}
