<script lang="ts">
import Router, { location, push } from "svelte-spa-router"
import { get } from "svelte/store"
import CreateIcon from "~icons/ri/add-circle-line"
import HistoryIcon from "~icons/ri/history-fill"
import PencilIcon from "~icons/ri/pencil-line"
import CogIcon from "~icons/ri/settings-line"
import RouteButton from "./RouteButton.svelte"
import CreateTest from "./routes/create-test.svelte"
import TestsInProgress from "./routes/tests-in-progress.svelte"
import TestEntrypoint from "./routes/take-test/entrypoint.svelte"
import TestHistory from "./routes/test-history.svelte"

const routes = {
  "/create_test": CreateTest,
  "/take_test": TestsInProgress,
  "/take_test/:test_id": TestEntrypoint,
  "/test_history": TestHistory,
  "/test_history/:test_id": TestEntrypoint,
}

if (get(location) === "/") {
  push("/create_test")
}
</script>

<div class="flex h-full">
    <div class="flex flex-col gap-3 min-w-[200px] p-5">
        <div class="flex gap-2 items-center mb-1">
            <CogIcon class="size-9" />
            <h1 class="font-black text-2xl">studyap.org</h1>
        </div>

        <RouteButton name="Create Test" target="/create_test">
            <CreateIcon class="size-6" slot="icon" />
        </RouteButton>
        <RouteButton
            name="Take Test"
            target="/take_test"
            isSelected={(target, current) => current.startsWith(target)}
        >
            <PencilIcon class="size-6" slot="icon" />
        </RouteButton>
        <RouteButton name="Test History" target="/test_history">
            <HistoryIcon class="size-6" slot="icon" />
        </RouteButton>
    </div>
    <div class="flex-1">
        <Router {routes} />
    </div>
</div>
