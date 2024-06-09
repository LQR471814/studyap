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
import ProfileIcon from "~icons/ri/account-circle-line"
import LogoutIcon from "~icons/ri/logout-box-line"
import { api } from "@/src/api"
import { twMerge } from "tailwind-merge"

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

// const profile = api.profile.query()
</script>

<div class="flex">
    <div class="flex flex-col gap-3 min-w-[200px] p-5 sticky top-0 h-[100dvh]">
        <div class="flex gap-2 items-center mb-1">
            <CogIcon class="size-9" />
            <h1 class="font-black text-2xl">studyap.org</h1>
        </div>

        <!-- <div class="flex gap-3 px-3 py-2"> -->
        <!--     <ProfileIcon class="size-6" /> -->
        <!--     {#await profile} -->
        <!--         <p class="font-medium">Loading...</p> -->
        <!--     {:then profile} -->
        <!--         <p class="font-medium">{profile.email}</p> -->
        <!--     {:catch err} -->
        <!--         <p class="font-medium">ERROR</p> -->
        <!--     {/await} -->
        <!-- </div> -->

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
        <RouteButton
            name="Test History"
            target="/test_history"
            isSelected={(target, current) => current.startsWith(target)}
        >
            <HistoryIcon class="size-6" slot="icon" />
        </RouteButton>

        <button
            class={twMerge(
                "flex gap-3",
                "border-2 border-transparent hover:border-red-700",
                "font-medium px-3 py-2 text-red-700 rounded-lg transition-all",
            )}
            on:click={() => alert("accounts not implemented yet")}
        >
            <LogoutIcon class="size-6" />
            <span>Log out</span>
        </button>
    </div>
    <div class="flex-1">
        <Router {routes} />
    </div>
</div>
