<script lang="ts">
import CreateIcon from "~icons/ri/add-circle-line"
import HistoryIcon from "~icons/ri/history-fill"
import PencilIcon from "~icons/ri/pencil-line"
import CogIcon from "~icons/ri/settings-line"
import CreateTest from "./routes/create-test.svelte"
import TestSelector from "./routes/take-test/selector.svelte"
import TestHistory from "./routes/test-history.svelte"
import TakeTest from "./routes/take-test/test/entrypoint.svelte"
import Router, { location, push } from "svelte-spa-router"
import { get } from "svelte/store"
import RouteButton from "./RouteButton.svelte"

const routes = {
  "/test_history": TestHistory,
  "/create_test": CreateTest,
  "/take_test": TestSelector,
  "/take_test/:test_id": TakeTest,
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
