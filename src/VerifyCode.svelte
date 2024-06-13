<script lang="ts">
  import * as Input from "@ui-lib/components/ui/input";
  import { Button } from "@ui-lib/components/ui/button";
  import { fly } from "svelte/transition";
  import Branding from "@ui-lib/components/custom/branding.svelte";
  import { publicApi, token } from "./api";

  let code: string;
  let disabled = false;
  let error: Error | undefined;

  const submit = () => {
    disabled = true;
    publicApi.verifyCode
      .mutate(code.trim())
      .then((value) => {
        disabled = false;
        if (!value) {
          error = new Error("The provided code is invalid or expired.");
          return;
        }
        token.set(value)
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
    <p class="text-sm px-1">
      A verification code has been sent to your email address, please enter it
      to continue.
    </p>
    <Input.Root
      type="text"
      placeholder="Enter your verification code"
      bind:value={code}
      on:keypress={(e) => {
        if (e.key === "Enter") {
          submit();
        }
      }}
    />
    {#if error}
      <p class="text-red-700">{error.message}</p>
    {/if}
    <Button class="w-fit" {disabled} on:click={submit}>Verify</Button>
  </div>
</div>
