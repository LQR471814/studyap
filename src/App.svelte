<script lang="ts">
    import HistoryIcon from "~icons/ri/history-fill";
    import SidebarButton from "./components/SidebarButton.svelte";
    import TestHistory from "./routes/TestHistory.svelte";

    type Route = "test-history";

    let route: Route = "test-history";
</script>

<div class="flex gap-5 p-4">
    <div class="flex flex-col gap-3 min-w-[200px]">
        <h1 class="font-black text-2xl">studyap.org</h1>
        <SidebarButton selected={route === "test-history"}>
            <HistoryIcon name="icon" />
            Test History
        </SidebarButton>
    </div>
    <div class="flex-1">
        {#if route === "test-history"}
            <TestHistory />
        {/if}
    </div>
</div>
