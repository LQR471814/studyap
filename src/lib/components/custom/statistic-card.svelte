<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import ArrowDown from "~icons/ri/arrow-down-line";

    export let label: string;
    export let number: number;
    export let change = "";
    export let changeDirection: "up" | "down" | "none" | undefined = undefined;
</script>

<div class="flex gap-3">
    <div
        class={twMerge(
            "rounded-full w-[100px] h-[100px] text-green-700 p-4",
            "bg-gradient-to-b from-green-200 to-transparent",
        )}
    >
        <slot name="icon" />
    </div>
    <div class="flex flex-col gap-1">
        <p class="text-gray-500">{label}</p>
        <h1 class="font-black text-3xl">{number}</h1>
        {#if changeDirection}
            <p
                class={twMerge(
                    "flex text-green-700",
                    changeDirection === "down" ? "text-red-700" : "",
                )}
            >
                {#if changeDirection !== "none"}
                    <ArrowDown
                        class={changeDirection === "up" ? "rotate-180" : ""}
                    />
                {/if}
                {change}
            </p>
        {/if}
    </div>
</div>
