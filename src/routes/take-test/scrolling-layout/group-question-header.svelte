<script lang="ts">
  import type { Test } from "@/api/protected";

  export let group: Test["testStimulus"][number];

  $: style = group.frqAttempt.length > 0 ? ("frq" as const) : ("mcq" as const);
  $: minQuestionNumber =
    style === "mcq"
      ? group.mcqAttempt[0].questionNumber
      : group.frqAttempt[0].questionNumber;
  $: maxQuestionNumber =
    style === "mcq"
      ? group.mcqAttempt[group.mcqAttempt.length - 1].questionNumber
      : group.frqAttempt[group.frqAttempt.length - 1].questionNumber;
</script>

<h2 class="text-xl font-semibold">
  Questions {minQuestionNumber} - {maxQuestionNumber}
  <slot name="suffix" />
</h2>

