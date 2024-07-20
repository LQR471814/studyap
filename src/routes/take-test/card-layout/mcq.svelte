<script lang="ts">
  import Mcq from "../shared/mcq.svelte";
  import type { Test } from "@/api/protected";

  export let mcq: Test["testStimulus"][number]["mcqAttempt"][number];
  let response = mcq.response;
</script>

<Mcq
  testAttemptId={mcq.testId}
  questionNumber={mcq.questionNumber}
  questionId={mcq.questionId}
  question={mcq.question.content}
  questionChoices={mcq.question.questionChoice}
  selected={response}
  on:select={(e) => {
    response = e.detail;
  }}
/>
