<script setup lang="ts">
import type { Portfolio } from '#contracts'

defineProps<{ portfolio?: Portfolio; loading: boolean }>()
</script>

<template>
  <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <UiStatTile label="Total deposits" hint="All accounts, in USD" :loading="loading">
      <UiAmount v-if="portfolio" :money="{ amount: portfolio.totalBalanceUsd, currency: 'USD' }" />
    </UiStatTile>
    <UiStatTile label="Outstanding loans" hint="Principal remaining" :loading="loading">
      <UiAmount v-if="portfolio" :money="{ amount: portfolio.totalOutstandingUsd, currency: 'USD' }" />
    </UiStatTile>
    <UiStatTile label="Active loans" hint="Disbursed and repaying" :loading="loading">
      {{ portfolio?.activeLoans }}
    </UiStatTile>
    <UiStatTile label="Applications in progress" hint="Submitted, in review or approved" :loading="loading">
      {{ portfolio?.pendingApplications }}
    </UiStatTile>
  </dl>
</template>
