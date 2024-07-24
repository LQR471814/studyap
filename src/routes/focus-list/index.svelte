<script lang="ts">
  import { fly } from "svelte/transition";
  import FocusList from "./focus-list.svelte";
</script>

<div class="p-5" in:fly={{ y: 10 }}>
  <FocusList />
</div>
