<script setup lang="ts">
defineProps<{ label: string; hint?: string; loading?: boolean }>()
</script>

<template>
  <div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
    <dt class="text-sm font-medium text-fg-muted">{{ label }}</dt>
    <dd class="mt-2 text-2xl font-bold tabular">
      <UiSkeleton v-if="loading" class="h-8 w-32" />
      <slot v-else />
    </dd>
    <dd v-if="hint" class="mt-1 text-xs text-fg-muted">{{ hint }}</dd>
  </div>
</template>
