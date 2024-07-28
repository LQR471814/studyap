<script lang="ts">
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    PointElement,
    RadialLinearScale,
    LineElement,
  } from "chart.js";
  import { params } from "svelte-spa-router";
  import SubjectProgressChart from "./subject-progress-chart.svelte";
  import UnitProgressChart from "./unit-progress-chart.svelte";
  import { fly } from "svelte/transition";

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    PointElement,
    RadialLinearScale,
    LineElement,
  );

  $: subjectId = $params?.subject_id;
</script>

<div class="flex flex-col gap-3 p-5" in:fly={{ y: 10 }}>
  {#if !subjectId}
    <SubjectProgressChart />
  {:else}
    <UnitProgressChart subjectId={Number(subjectId)} />
  {/if}
</div>
