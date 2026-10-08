<script setup lang="ts">
/**
 * GOV.UK-style error summary: rendered after a failed submit, receives focus,
 * and links each message to its field so keyboard and screen reader users
 * can jump straight to the problem.
 */
const props = defineProps<{ errors: Partial<Record<string, string | undefined>> }>()

const root = ref<HTMLElement>()
const entries = computed(() =>
  Object.entries(props.errors).filter((entry): entry is [string, string] => Boolean(entry[1])),
)

function focusField(name: string) {
  document.getElementById(`field-${name}`)?.focus()
}

defineExpose({
  focus: () => nextTick(() => root.value?.focus()),
})
</script>

<template>
  <div
    v-if="entries.length"
    ref="root"
    tabindex="-1"
    role="alert"
    aria-labelledby="error-summary-title"
    class="rounded-lg border-2 border-red-600 bg-red-50 p-4 dark:bg-red-950"
  >
    <h2 id="error-summary-title" class="font-semibold text-red-900 dark:text-red-100">There is a problem</h2>
    <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
      <li v-for="[name, message] in entries" :key="name">
        <a :href="`#field-${name}`" class="text-red-800 underline dark:text-red-200" @click.prevent="focusField(name)">
          {{ message }}
        </a>
      </li>
    </ul>
  </div>
</template>
