<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: undefined })
</script>

<template>
  <span class="inline-flex items-center gap-2" :role="label ? 'status' : undefined">
    <svg class="animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <span v-if="label" class="sr-only">{{ label }}</span>
  </span>
</template>
