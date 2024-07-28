<script lang="ts">
  import { Radar } from "svelte-chartjs";
  import { protectedApi } from "@/src/api";
  import { createQuery } from "@tanstack/svelte-query";
  import type { UnitStats } from "@/api/methods/getUnitProgressChart"

  export let subjectId: number;

  $: chartData = createQuery({
    queryKey: ["getUnitProgressChart", subjectId],
    queryFn: () =>
      protectedApi.getUnitProgressChart.query({
        subjectId,
      }),
  });

  function createChartData(stats: UnitStats[]) {
    const labels: string[] = stats.map((s) => s.name);

    const completedDataset = {
      label: "Completed Questions",
      backgroundColor: "rgba(71, 225, 167, 0.5)",
      borderColor: "rgb(71, 225, 167)",
      data: stats.map((s) => s.completedQuestions),
    };
    const totalDataset = {
      label: "Total Questions",
      backgroundColor: "rgba(194, 116, 161, 0.5)",
      borderColor: "rgb(194, 116, 161)",
      data: stats.map((s) => s.totalQuestions),
    };

    return {
      labels,
      datasets: [totalDataset, completedDataset],
    };
  }
</script>

<h1 class="text-2xl font-semibold">{$chartData.data?.subjectName ?? "Subject"} progress</h1>

{#if $chartData.data}
  {@const dataRadar = createChartData($chartData.data.stats)}
  <Radar data={dataRadar} options={{ responsive: true }} />
{:else if $chartData.isPending}
  <p>loading...</p>
{/if}
