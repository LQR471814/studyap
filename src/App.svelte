<script lang="ts">
import Router, { location, push } from "svelte-spa-router"
import { get } from "svelte/store"
import Login from "./Login.svelte"
import VerifyCode from "./VerifyCode.svelte"
import Dashboard from "./Dashboard.svelte"
import { token } from "./api"
import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"

const queryClient = new QueryClient()

const routes = {
  "/login": Login,
  "/verify_code": VerifyCode,
}

if (!(get(location) in routes) && !$token) {
  push("/login")
}
</script>

<QueryClientProvider client={queryClient}>
  {#if $token}
    <Dashboard />
  {:else}
    <Router {routes} />
  {/if}
</QueryClientProvider>
