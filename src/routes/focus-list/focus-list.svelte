<script lang="ts">
  import { protectedApi } from "@/src/api";
  import { createQuery } from "@tanstack/svelte-query";
  import { twMerge } from "tailwind-merge";
  import * as Accordion from "@ui-lib/components/ui/accordion";

  export let className: string | undefined = undefined;

  const focusList = createQuery({
    queryKey: ["getFocusList"],
    queryFn: () => protectedApi.getFocusList.query(),
  });
</script>

<div class={twMerge("flex flex-col gap-5", className)}>
  <h1 class="text-2xl font-semibold">Focus List</h1>

  <p>
    The subjects and units here are ordered from top to bottom, where the
    subjects and units closer to the top are likely in need of more practice.
  </p>

  {#if $focusList.data}
    <Accordion.Root>
      {#each $focusList.data as subject}
        <Accordion.Item value={subject.id.toString()}>
          <Accordion.Trigger>
            <p>{subject.name}</p>
          </Accordion.Trigger>
          <Accordion.Content>
            <table class="w-full">
              <thead>
                <tr class="text-left">
                  <th>Name</th>
                  <th>Practiced</th>
                  <th>Average score</th>
                </tr>
              </thead>
              <tbody>
                {#each subject.units as unit}
                  <tr>
                    <td>{unit.name}</td>
                    <td
                      class={twMerge(
                        unit.practiced ? "text-green-700" : "text-red-700",
                      )}
                    >
                      {unit.practiced ? "Y" : "N"}
                    </td>
                    <td>{Math.round(unit.overallPercent * 100)}%</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  {/if}
</div>
