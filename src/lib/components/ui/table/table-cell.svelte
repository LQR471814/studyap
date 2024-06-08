<script lang="ts">
	import type { HTMLTdAttributes } from "svelte/elements";
	import { cn } from "@ui-lib/components/utils.js";

	type $$Props = HTMLTdAttributes;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<td
	class={cn("align-middle [&:has([role=checkbox])]:pr-0", className)}
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</td>
