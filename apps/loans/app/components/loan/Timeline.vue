<script setup lang="ts">
import { LOAN_STATUS_LABELS, type LoanHistoryEntry } from '#contracts'

defineProps<{ history: LoanHistoryEntry[] }>()
</script>

<template>
  <ol class="relative space-y-5 border-l-2 border-border pl-6">
    <li v-for="(entry, index) in history" :key="`${entry.status}-${entry.at}`" class="relative">
      <span
        class="absolute top-1 -left-[31px] size-3.5 rounded-full border-2 border-surface"
        :class="index === history.length - 1 ? 'bg-brand-600' : 'bg-fg-muted'"
        aria-hidden="true"
      />
      <p class="font-medium">{{ LOAN_STATUS_LABELS[entry.status] }}</p>
      <p class="text-sm text-fg-muted">
        <time :datetime="entry.at">{{ formatDateTime(entry.at) }}</time>
        <template v-if="entry.note"> · {{ entry.note }}</template>
      </p>
    </li>
  </ol>
</template>
