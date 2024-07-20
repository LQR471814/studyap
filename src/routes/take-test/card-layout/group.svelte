<script lang="ts">
  import { protectedApi } from "@/src/api";
  import { createQuery } from "@tanstack/svelte-query";
  import Stimulus from "../shared/stimulus.svelte";

  export let testAttemptId: number;
  export let stimulusId: number;
  export let lastQuestionNumber: number;

  $: group = createQuery({
    queryKey: ["getGroup", stimulusId],
    queryFn: () =>
      protectedApi.getGroup.query({
        testAttemptId,
        stimulusId,
      }),
  });
</script>

{#if $group.data}
  <h2 class="text-xl font-semibold">
    Questions {$group.data.minNo} - {$group.data.maxNo} of total {lastQuestionNumber} questions
  </h2>
  <div>
    <Stimulus stimulus={$group.data.group.stimulus} />
  </div>
{/if}
