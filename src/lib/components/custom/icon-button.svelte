<script lang="ts">
  import { twMerge } from "tailwind-merge";

  export let disabled = false;
</script>

<button
  class={twMerge(
    "p-1 rounded-full transition-all hover:cursor-pointer",
    "border-2 border-solid border-transparent hover:border-black",
    "active:bg-black active:text-white",
    "disabled:cursor-default disabled:border-transparent disabled:text-zinc-500 disabled:bg-transparent"
  )}
  {disabled}
  on:click
>
  <slot />
</button>
