<script setup lang="ts">
import type { DashboardData } from '../../composables/useDashboard'

defineProps<{ credit?: DashboardData['creditScore']; loading: boolean }>()
</script>

<template>
  <UiCard title="Credit score">
    <template #actions>
      <NuxtLink
        to="/credit-score"
        class="text-sm font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-100"
      >
        Details<span class="sr-only"> about your credit score</span>
      </NuxtLink>
    </template>
    <UiSkeleton v-if="loading" class="mx-auto h-36 w-56" />
    <template v-else-if="credit">
      <CreditScoreGauge :score="credit.current" :band="credit.band" />
      <p class="mt-3 text-center text-xs text-fg-muted">
        Updated {{ formatDate(credit.updatedAt) }} · Credit Bureau Cambodia
      </p>
    </template>
  </UiCard>
</template>
