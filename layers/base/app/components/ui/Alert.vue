<script setup lang="ts">
const props = withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string }>(), {
  tone: 'info',
  title: undefined,
})

const toneClass = computed(
  () =>
    ({
      info: 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-50',
      success: 'border-green-300 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-50',
      warning: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50',
      danger: 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-50',
    })[props.tone],
)
// Errors interrupt (alert); everything else is announced politely (status).
const role = computed(() => (props.tone === 'danger' ? 'alert' : 'status'))
</script>

<template>
  <div :role="role" class="rounded-lg border p-4 text-sm" :class="toneClass">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <div :class="{ 'mt-1': title }"><slot /></div>
  </div>
</template>
