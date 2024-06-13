<script lang="ts">
  import * as Input from "@ui-lib/components/ui/input";
  import { Button } from "@ui-lib/components/ui/button";
  import { publicApi } from "./api";
  import Branding from "@ui-lib/components/custom/branding.svelte";
  import { push } from "svelte-spa-router";
  import { fly } from "svelte/transition";

  let email: string;
  let disabled = false;
  let error: Error | undefined;

  const submit = () => {
    disabled = true;
    publicApi.sendCode
      .mutate(email)
      .then(() => {
        disabled = false;
        push("/verify_code");
      })
      .catch((err) => {
        disabled = false;
        error = err;
        console.error(err);
      });
  };
</script>

<div class="flex h-full" in:fly={{ y: 10 }}>
  <div class="flex flex-col gap-3 m-auto max-w-xs">
    <Branding />
    <Input.Root
      type="email"
      placeholder="Login with your email address"
      bind:value={email}
      on:keypress={(e) => {
        if (e.key === "Enter") {
          submit();
        }
      }}
    />
    {#if error}
      <p class="text-red-700">{error.message}</p>
    {/if}
    <Button class="w-fit" {disabled} on:click={submit}>Continue</Button>
  </div>
</div>
