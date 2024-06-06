<script lang="ts">
    import ScoreIcon from "~icons/ri/graduation-cap-line";
    import CheckIcon from "~icons/ri/check-fill";
    import BookIcon from "~icons/ri/book-open-line";
    import StatisticCard from "@ui-lib/components/custom/statistic-card.svelte";
    import { format } from "date-fns";

    type TestAttempt = {
        subject: string;
        date: Date;
        scored: number;
        total: number;
    };

    const attempts: TestAttempt[] = [
        {
            subject: "AP US History",
            date: new Date(2002, 8, 24),
            scored: 100,
            total: 250,
        },
        {
            subject: "AP Physics 1",
            date: new Date(2002, 10, 24),
            scored: 30,
            total: 120,
        },
    ];
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
    <div class="flex flex-col gap-5">
        <h1 class="text-2xl">Past Tests</h1>
        <div class="grid gap-3 grid-cols-4">
            <h3 class="text-md text-gray-500">Subject</h3>
            <h3 class="text-md text-gray-500">Date</h3>
            <h3 class="text-md text-gray-500">Scored</h3>
            <h3 class="text-md text-gray-500">Total</h3>
            {#each attempts as attempt}
                <button>{attempt.subject}</button>
                <button>{format(attempt.date, "M / d / yyyy")}</button>
                <button>{attempt.scored}</button>
                <button>{attempt.total}</button>
            {/each}
        </div>
    </div>
</div>
