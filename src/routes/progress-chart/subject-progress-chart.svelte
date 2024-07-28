<script lang="ts">
  import { Radar } from "svelte-chartjs";
  import { protectedApi } from "@/src/api";
  import { createQuery } from "@tanstack/svelte-query";
  import type { SubjectStats } from "@/api/methods/getSubjectProgressChart";
  import { twMerge } from "tailwind-merge";
  import PlayIcon from "~icons/ri/play-mini-line";
  import { push } from "svelte-spa-router";

  const chartData = createQuery({
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
</script>

<h1 class="text-2xl font-semibold">Total progress</h1>

{#if $chartData.data}
  <p>
    Click any of the following specific subjects below to view detailed progress
    information for that subject.
  </p>

  <div class="flex gap-2 flex-wrap">
    {#each $chartData.data as subjectStat}
      <button
        class={twMerge(
          "border-2 border-solid border-transparent hover:border-black rounded-lg",
          "transition-all px-2 py-1 text-sm flex gap-1 items-center",
        )}
        on:click={() => {
          push(`/progress_chart/${subjectStat.id}`);
        }}
      >
        <PlayIcon class="size-6" />
        {subjectStat.name}
      </button>
    {/each}
  </div>

  <Radar
    data={createChartData($chartData.data)}
    options={{
      responsive: true,
      scales: {
        r: {
          suggestedMin: 0,
          ticks: {
            stepSize: 1,
            maxTicksLimit: 20,
          },
        },
      },
    }}
  />
{:else if $chartData.isPending}
  <p>loading...</p>
{/if}
