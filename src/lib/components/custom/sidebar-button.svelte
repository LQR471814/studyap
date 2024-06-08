<script lang="ts">
import { Button } from "bits-ui"
import { fly } from "svelte/transition"
import { twMerge } from "tailwind-merge"
import ArrowRightIcon from "~icons/ri/arrow-right-s-fill"

export let selected = false
</script>

<Button.Root
    class={twMerge(
        "button text-md border-2 border-transparent text-left transition-all",
        "hover:border-neutral-900 font-medium",
        selected
            ? "bg-neutral-900 text-white hover:cursor-default border-neutral-900 shadow-xl"
            : "",
    )}
    on:click
>
    <slot name="icon" />
    <slot />
    {#if selected}
        <div class="ml-auto" transition:fly={{ x: 10 }}>
            <ArrowRightIcon />
        </div>
    {/if}
</Button.Root>
