<script lang="ts">
    import ScoreIcon from "~icons/ri/graduation-cap-line";
    import CheckIcon from "~icons/ri/check-fill";
    import BookIcon from "~icons/ri/book-open-line"
    import StatisticCard from "../components/StatisticCard.svelte";
</script>

<div class="flex flex-col gap-10">
    <h1 class="text-2xl">Hello student 👋🏼,</h1>
    <div class="flex gap-5">
        <div class="flex gap-10 justify-evenly w-full py-3 px-12">
            <StatisticCard
                label="Average Score"
                number={4.25}
                changeDirection="up"
                change="16% this month"
            >
                <ScoreIcon class="w-full h-full" slot="icon" />
            </StatisticCard>
            <StatisticCard
                label="Tests Completed"
                number={23}
                changeDirection="down"
                change="1% this month"
            >
                <CheckIcon class="w-full h-full" slot="icon" />
            </StatisticCard>
            <StatisticCard label="Available Tests" number={250}>
                <BookIcon class="w-full h-full" slot="icon" />
            </StatisticCard>
        </div>
    </div>
    <div class="flex gap-5">
        <div>
        </div>
    </div>
</div>
