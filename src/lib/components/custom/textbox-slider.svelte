<script lang="ts">
    import { Slider } from "@ui-lib/components/ui/slider";
    import { Input } from "@ui-lib/components/ui/input";

    export let placeholder: string | undefined = undefined;
    export let value: number;
    export let max: number;
    export let step = 1;
</script>

<div class="flex gap-5">
    <Input
        class="border-neutral-900 border-2 rounded-lg max-w-[20%]"
        type="number"
        {placeholder}
        bind:value
    />
    <Slider
        class="min-w-[150px]"
        value={[value]}
        {max}
        {step}
        onValueChange={(e) => {
            value = e[0];
        }}
    />
</div>
