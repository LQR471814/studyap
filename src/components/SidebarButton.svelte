<script lang="ts">
    import { Button } from "bits-ui";
    import { fly } from "svelte/transition";
    import { twMerge } from "tailwind-merge";
    import ArrowRightIcon from "~icons/ri/arrow-right-s-fill";

    export let selected = false;
</script>

<Button.Root
    class={twMerge(
        "text-md border-2 border-black text-left transition-all",
        "bg-white hover:bg-black hover:text-white",
        selected ? "bg-black text-white hover:cursor-default shadow-xl" : "",
    )}
    on:click
>
    <slot name="icon" />
    <slot />
    {#if selected}
        <div class="ml-auto" transition:fly={{ x: 20 }}>
            <ArrowRightIcon />
        </div>
    {/if}
</Button.Root>
