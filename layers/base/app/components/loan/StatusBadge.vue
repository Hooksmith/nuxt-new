<script setup lang="ts">
import { LOAN_STATUS_LABELS, type LoanStatus } from '#contracts'
import type { BadgeTone } from '../ui/Badge.vue'

const props = defineProps<{ status: LoanStatus }>()

// Colour is never the only signal: each status also has a distinct icon and text.
const config: Record<LoanStatus, { tone: BadgeTone; icon: string }> = {
  submitted: { tone: 'neutral', icon: '○' },
  under_review: { tone: 'info', icon: '◔' },
  approved: { tone: 'success', icon: '✓' },
  rejected: { tone: 'danger', icon: '✕' },
  disbursed: { tone: 'success', icon: '●' },
  withdrawn: { tone: 'warning', icon: '–' },
}
const current = computed(() => config[props.status])
</script>

<template>
  <UiBadge :tone="current.tone">
    <span aria-hidden="true">{{ current.icon }}</span>
    {{ LOAN_STATUS_LABELS[status] }}
  </UiBadge>
</template>
