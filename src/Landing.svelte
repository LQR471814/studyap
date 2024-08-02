<script lang="ts">
  import { fly } from "svelte/transition";
  import Branding from "@ui-lib/components/custom/branding.svelte";
  import { Button } from "@ui-lib/components/ui/button";
  import { push } from "svelte-spa-router";
</script>

<div class="flex h-full" in:fly={{ y: 10 }}>
  <div class="flex flex-col gap-3 m-auto max-w-xs">
    <Branding />
    <Button class="w-fit" on:click={() => push("/login")}>Login</Button>
  </div>
</div>
