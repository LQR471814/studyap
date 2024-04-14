<script lang="ts">
    import type { MCQ } from "@/generation/types";
    import { formatMCQOption } from "@/lib/general";
    import { twMerge } from "tailwind-merge";

    export let mcq: MCQ;

    let choice: number | undefined;
</script>

<div>
    <p>{mcq.question}</p>
    <ol>
        {#each mcq.options as option, i}
            <li class="pl-7">
                <button
                    class={twMerge(
                        "hover:underline",
                        choice === i
                            ? mcq.answer === i
                                ? "text-green-600"
                                : "text-red-600"
                            : "",
                    )}
                    on:click={() => {
                        choice = i;
                    }}
                >
                    {formatMCQOption(i, option)}
                </button>
            </li>
        {/each}
    </ol>
</div>
