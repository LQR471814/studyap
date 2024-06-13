<script lang="ts">
  import Router, { location, push } from "svelte-spa-router";
  import { get } from "svelte/store";
  import CreateIcon from "~icons/ri/add-circle-line";
  import HistoryIcon from "~icons/ri/history-fill";
  import PencilIcon from "~icons/ri/pencil-line";
  import RouteButton from "@ui-lib/components/custom/route-button.svelte";
  import CreateTest from "./routes/create-test.svelte";
  import TestsInProgress from "./routes/tests-in-progress.svelte";
  import TestEntrypoint from "./routes/take-test/entrypoint.svelte";
  import TestHistory from "./routes/test-history.svelte";
  import LogoutIcon from "~icons/ri/logout-box-line";
  import { twMerge } from "tailwind-merge";
  import Branding from "@ui-lib/components/custom/branding.svelte";
  import * as AlertDialog from "@ui-lib/components/ui/alert-dialog";
  import { token } from "./api";

  const routes = {
    "/create_test": CreateTest,
    "/take_test": TestsInProgress,
    "/take_test/:test_id": TestEntrypoint,
    "/test_history": TestHistory,
    "/test_history/:test_id": TestEntrypoint,
  };

  if (!(get(location) in routes)) {
    push("/create_test");
  }
</script>

<div class="flex">
  <div class="flex flex-col gap-3 min-w-[200px] p-5 sticky top-0 h-[100dvh]">
    <Branding />
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

    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <button
          class={twMerge(
            "flex gap-3 w-full",
            "border-2 border-transparent hover:border-red-700",
            "font-medium px-3 py-2 text-red-700 rounded-lg transition-all",
          )}
        >
          <LogoutIcon class="size-6" />
          <span>Log out</span>
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Log out?</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to log out?
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action
            on:click={() => {
              token.set(undefined);
              push("/login");
            }}
          >
            Log out
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </div>
  <div class="flex-1">
    <Router {routes} />
  </div>
</div>
