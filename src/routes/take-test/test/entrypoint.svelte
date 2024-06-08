<script lang="ts">
import { api } from "@/src/api"
import { params } from "svelte-spa-router"
import { fly } from "svelte/transition"
import Content from "./content.svelte"
</script>

{#if $params && !isNaN(Number($params.test_id))}
    {#await api.tests.getTest.query(Number($params.test_id))}
        <div class="flex h-full" in:fly={{ y: 10 }}>
            <p class="m-auto">Loading...</p>
        </div>
    {:then test}
        <Content {test} />
    {:catch err}
        <div class="flex h-full" in:fly={{ y: 10 }}>
            <p class="m-auto">ERROR: {err.message}</p>
        </div>
    {/await}
{/if}
