<script lang="ts">
    import { getTestList } from "./api"
    import Test from "./Test.svelte"

    const testList = getTestList()

    let selectedTest: number | undefined
</script>

<main>
    {#if selectedTest === undefined}
        {#await testList}
            <p>loading...</p>
        {:then list}
            <ul>
            {#each list as t}
                <li>
                    <button
                        class="text-blue-700 hover:underline"
                        on:click={() => {
                            selectedTest = t.id
                        }}
                    >
                        {t.id} - {t.subject}
                    </button>
                </li>
            {/each}
            </ul>
        {:catch error}
            {error.message}
        {/await}
    {:else}
        <Test
            id={selectedTest}
            on:close={() => {
                selectedTest = undefined
            }}
        />
    {/if}
</main>

