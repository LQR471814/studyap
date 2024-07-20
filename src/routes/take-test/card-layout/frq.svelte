<script lang="ts">
  import type { Test } from "@/api/protected";
  import Frq from "../shared/frq.svelte";

  export let frq: Test["testStimulus"][number]["frqAttempt"][number];
  let response = frq.response ?? ""
</script>

<Frq
  bind:response={response}
  testAttemptId={frq.testId}
  questionNumber={frq.questionNumber}
  questionId={frq.questionId}
  question={frq.question.content}
  explanation={frq.scoringNotes}
  scored={frq.scoredPoints}
  total={frq.question.totalPoints}
/>
