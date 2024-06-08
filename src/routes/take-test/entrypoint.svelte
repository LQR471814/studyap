<script lang="ts">
    import { api } from "@/src/api";
    import { location, params } from "svelte-spa-router";
    import { fly } from "svelte/transition";
    import Content from "./content.svelte";
    import { setContext } from "svelte";
    import { type Context, contextSymbol } from "./context";
    import type { Test } from "@/api/routers/complete-tests";

    let test: Test | undefined;
    let err: Error | undefined;
    $: {
        if (!$params || Number.isNaN(Number($params.test_id))) {
            break $;
        }
        api.completeTests.getTest
            .query(Number($params.test_id))
            .then((value) => {
                test = value;
            })
            .catch((value) => {
                err = value;
            });
    }

    $: withCorrections = $location.startsWith("/test_history");
    $: {
        if (!test) {
            break $;
        }
        setContext<Context>(contextSymbol, {
            withCorrections,
            testAttemptId: test.id,
        });
    }
</script>

{#if err}
    <div class="flex h-full" in:fly={{ y: 10 }}>
        <p class="m-auto">ERROR: {err.message}</p>
    </div>
{:else if test}
    <Content {test} {withCorrections} />
{:else}
    <div class="flex h-full" in:fly={{ y: 10 }}>
        <p class="m-auto">Loading...</p>
    </div>
{/if}
