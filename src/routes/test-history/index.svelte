<script lang="ts">
  import { fly } from "svelte/transition";
  import PastTests from "./past-tests.svelte";
</script>

<div class="p-5" in:fly={{ y: 10 }}>
  <PastTests />
</div>

<!-- <div class="flex gap-5"> -->
<!--     <div class="flex gap-10 justify-evenly w-full py-3 px-12"> -->
<!--         <StatisticCard -->
<!--             label="Average Score" -->
<!--             number={4.25} -->
<!--             changeDirection="up" -->
<!--             change="16% this month" -->
<!--         > -->
<!--             <ScoreIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--         <StatisticCard -->
<!--             label="Tests Completed" -->
<!--             number={23} -->
<!--             changeDirection="down" -->
<!--             change="1% this month" -->
<!--         > -->
<!--             <CheckIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--         <StatisticCard label="Available Tests" number={250}> -->
<!--             <BookIcon class="w-full h-full" slot="icon" /> -->
<!--         </StatisticCard> -->
<!--     </div> -->
<!-- </div> -->
