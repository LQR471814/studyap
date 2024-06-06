<script lang="ts">
import * as Select from "@ui-lib/components/ui/select"
import { api } from "../api"
import TextboxSlider from "@ui-lib/components/custom/textbox-slider.svelte"
import MultiSelect from "svelte-multiselect"
import { Button } from "@ui-lib/components/ui/button"
import { createEventDispatcher } from "svelte"

// subject
type Subject = {
  id: number
  name: string
}
let subjects:
  | {
      value: Subject
      label: string
    }[]
  | undefined = undefined
$: {
  api.tests.listSubjects
    .query()
    .then((value) => {
      subjects = value.map((v) => ({
        value: v,
        label: v.name,
      }))
    })
    .catch((err) => {
      console.error(err)
    })
}
let selectedSubject: Subject | undefined

// units
type Unit = {
  id: number
  name: string
}
let units: Unit[] | undefined
$: {
  if (!selectedSubject) {
    break $
  }
  console.log("change", selectedSubject)
  api.tests.listUnits
    .query(selectedSubject.id)
    .then((value) => {
      units = value
    })
    .catch((err) => console.error(err))
}
let selectedUnits: { value: Unit; label: string }[] = []

// available questions
type AvailableQuestions = {
  mcqs: number
  frqs: number
}
let availableQuestions: AvailableQuestions | undefined
$: {
  if (!selectedSubject) {
    break $
  }
  api.tests.getAvailableQuestions
    .query({
      subjectId: selectedSubject.id,
      unitIds: selectedUnits.map((u) => u.value.id),
    })
    .then((value) => {
      availableQuestions = value
    })
    .catch((err) => console.error(err))
}
let mcqCount = 0
let frqCount = 0

const dispatcher = createEventDispatcher<{
  submit: { testId: number }
}>()

// submission logic
let submitting = false
async function submit() {
  if (!selectedSubject) {
    return
  }
  submitting = true
  try {
    const res = await api.tests.createTest.mutate({
      mcqCount,
      frqCount,
      units: selectedUnits.map((u) => u.value.id),
      subject: selectedSubject.id,
    })
    dispatcher("submit", { testId: res })
  } catch (err) {
    console.error(err)
  }
  submitting = false
}
</script>

<div class="flex h-full">
    <div class="flex flex-col gap-3 m-auto" style:--sms-max-width="515px">
        <h3 class="text-sm">Subject</h3>
        <Select.Root
            portal={null}
            onSelectedChange={(e) => {
                // @ts-expect-error
                selectedSubject = e?.value;
            }}
        >
            <Select.Trigger
                class="border-neutral-900 border-2 rounded-lg min-w-[300px]"
            >
                <Select.Value placeholder="Select a subject..." />
            </Select.Trigger>

            <Select.Content
                class="border-neutral-900 bg-white border-2 rounded-lg"
            >
                <Select.Group>
                    {#if subjects}
                        {#each subjects as item}
                            <Select.Item
                                class="hover:cursor-pointer"
                                value={item.value}
                                label={item.label}
                            >
                                <p>{item.label}</p>
                            </Select.Item>
                        {/each}
                    {:else}
                        <Select.Item
                            value="loading subjects..."
                            label="loading subjects..."
                        >
                            <p>Loading subjects...</p>
                        </Select.Item>
                    {/if}
                </Select.Group>
            </Select.Content>
        </Select.Root>

        {#if units}
            <h3 class="text-sm">Filter units</h3>
            <MultiSelect
                bind:selected={selectedUnits}
                placeholder="Select units..."
                options={units.map((u) => ({
                    value: u,
                    label: u.name,
                }))}
            />
        {/if}

        {#if availableQuestions}
            <div class="flex flex-col gap-2">
                <p class="text-sm">MCQ problems</p>
                <div class="flex gap-5 items-center">
                    <TextboxSlider
                        placeholder="MCQ count"
                        bind:value={mcqCount}
                        max={availableQuestions.mcqs}
                    />
                    <span>Available: {availableQuestions.mcqs}</span>
                </div>
                <p class="text-sm">FRQ problems</p>
                <div class="flex gap-5 items-center">
                    <TextboxSlider
                        placeholder="FRQ count"
                        bind:value={frqCount}
                        max={availableQuestions.frqs}
                    />
                    <span>Available: {availableQuestions.frqs}</span>
                </div>
            </div>
        {/if}

        <div class="flex justify-end">
            <Button
                disabled={submitting ||
                    selectedSubject === undefined ||
                    mcqCount === 0 ||
                    frqCount === 0}
                on:click={submit}
            >
                Create
            </Button>
        </div>
    </div>
</div>
