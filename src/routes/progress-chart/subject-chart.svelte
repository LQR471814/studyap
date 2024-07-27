<script lang="ts">
  import { Radar } from "svelte-chartjs";
  import { protectedApi } from "@/src/api";
  import { createQuery } from "@tanstack/svelte-query";
  import type { SubjectStats } from "@/api/methods/getSubjectProgressChart";

  const subjectChart = createQuery({
    queryKey: ["getSubjectProgressChart"],
    queryFn: () => protectedApi.getSubjectProgressChart.query(),
  });

  function createChartData(stats: SubjectStats[]) {
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

  $: dataRadar = $subjectChart.data
    ? createChartData($subjectChart.data)
    : undefined;
</script>

{#if dataRadar}
  <Radar data={dataRadar} options={{ responsive: true }} />
{/if}
