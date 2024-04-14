<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let question: string
    export let value = ""

    const dispatcher = createEventDispatcher<{ change: string }>()

    let textarea: HTMLTextAreaElement | null

    $: {
        if (!textarea) {
            break $
        }
        textarea.value = value
    }
</script>

<div>
    <p>{question}</p>
    <textarea
        bind:this={textarea}
        class="w-[80%] px-3 py-2 my-2 border border-black"
        placeholder="answer here..."
        value={value}
        on:change={(e) => {
            dispatcher("change", e.currentTarget.value)
        }}
    />
    <slot />
</div>
