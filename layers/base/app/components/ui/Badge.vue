<script lang="ts">
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{ tone?: BadgeTone }>(), { tone: 'neutral' })

const toneClass = computed(
  () =>
    ({
      neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
      info: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
      success: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100',
      warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
      danger: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
    })[props.tone],
)
</script>

<template>
  <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="toneClass">
    <slot />
  </span>
</template>
