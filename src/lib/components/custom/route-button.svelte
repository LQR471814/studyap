<script lang="ts">
import SidebarButton from "@ui-lib/components/custom/sidebar-button.svelte"
import { location, push } from "svelte-spa-router"

export let target: string
export let name: string
export let isSelected:
  | ((target: string, current: string) => boolean)
  | undefined = undefined
</script>

<SidebarButton
    selected={isSelected ? isSelected(target, $location) : $location === target}
    on:click={() => {
        if (isSelected ? isSelected(target, $location) : target === $location) {
            return;
        }
        push(target);
    }}
>
    <slot name="icon" />
    {name}
</SidebarButton>

