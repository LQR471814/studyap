<script lang="ts">
  import type { Test } from "@/api/protected";
  import { heuristicUnescape } from "@/lib/utils";

  export let stimulus: Test["testStimulus"][number]["stimulus"];
</script>

<div class="glass-panel">
  <p>
    {heuristicUnescape(stimulus.content ?? "")}
  </p>
  {#if stimulus.attribution}
    <p class="italic">
      — {heuristicUnescape(stimulus.attribution)}
    </p>
  {/if}
</div>
