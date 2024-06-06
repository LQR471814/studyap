<script lang="ts">
import SidebarButton from "@ui-lib/components/custom/sidebar-button.svelte"
import { fly } from "svelte/transition"
import HistoryIcon from "~icons/ri/history-fill"
import PencilIcon from "~icons/ri/pencil-line"
import CreateIcon from "~icons/ri/add-circle-line"
import CreateTest from "./routes/create-test.svelte"
import TakeTest from "./routes/take-test.svelte"
import TestHistory from "./routes/test-history.svelte"
import { hashRouter } from "./utils"

const router = hashRouter(["create_test", "take_test", "test_history"] as const)

let takingTestId: number | undefined
</script>

<div class="flex gap-10 p-4 h-full">
    <div class="flex flex-col gap-3 min-w-[200px]">
        <h1 class="font-black text-2xl mb-3">studyap.org</h1>
        <SidebarButton
            selected={$router === "create_test"}
            on:click={() => ($router = "create_test")}
        >
            <CreateIcon name="create icon" />
            Create Test
        </SidebarButton>
        <SidebarButton
            selected={$router === "take_test"}
            on:click={() => ($router = "take_test")}
        >
            <PencilIcon name="pencil icon" />
            Take Test
        </SidebarButton>
        <SidebarButton
            selected={$router === "test_history"}
            on:click={() => ($router = "test_history")}
        >
            <HistoryIcon name="history icon" />
            Test History
        </SidebarButton>
    </div>
    <div class="flex-1">
        {#if $router === "test_history"}
            <div in:fly={{ y: 10 }}>
                <TestHistory />
            </div>
        {:else if $router === "create_test"}
            <div class="h-full" in:fly={{ y: 10 }}>
                <CreateTest
                    on:submit={(e) => {
                        takingTestId = e.detail.testId;
                        router.set("take_test");
                    }}
                />
            </div>
        {:else if $router === "take_test"}
            <div in:fly={{ y: 10 }}>
                <TakeTest testId={takingTestId} />
            </div>
        {/if}
    </div>
</div>
