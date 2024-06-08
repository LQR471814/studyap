<script lang="ts">
export let question: string
export let questionNumber: number
</script>

<div class="flex gap-3 items-center">
    <div
        class="rounded-full border-2 border-gray-900 flex min-h-7 min-w-7 max-h-7 max-w-7"
    >
        <p class="font-semibold m-auto">
            {questionNumber}
        </p>
    </div>
    <p>{question}</p>
</div>
