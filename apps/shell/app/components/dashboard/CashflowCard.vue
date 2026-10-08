<script setup lang="ts">
import type { CashflowPoint } from '#contracts'

const props = defineProps<{ cashflow?: CashflowPoint[]; loading: boolean }>()

const labels = computed(() => props.cashflow?.map((p) => formatMonth(p.month)) ?? [])
const datasets = computed(() => [
  { label: 'Money in', data: props.cashflow?.map((p) => p.inflow / 100) ?? [], color: '#16a34a' },
  { label: 'Money out', data: props.cashflow?.map((p) => p.outflow / 100) ?? [], color: '#2563eb' },
])
const usd = (value: number) => formatCompactUsd(value * 100)
const rows = computed(
  () =>
    props.cashflow?.map((p) => [
      formatMonth(p.month),
      formatMoney({ amount: p.inflow, currency: 'USD' }),
      formatMoney({ amount: p.outflow, currency: 'USD' }),
    ]) ?? [],
)
</script>

<template>
  <UiCard title="Cash flow" description="Money in and out across all accounts, last 6 months">
    <UiSkeleton v-if="loading" class="h-64 w-full" />
    <template v-else-if="cashflow">
      <ClientOnly>
        <!-- chart.js is code-split and only downloaded in the browser -->
        <LazyChartsBarChart
          :labels="labels"
          :datasets="datasets"
          :format-value="usd"
          summary="Bar chart of monthly money in and money out. Data table available below."
        />
        <template #fallback><UiSkeleton class="h-64 w-full" /></template>
      </ClientOnly>
      <UiDataTable caption="Monthly cash flow" :columns="['Month', 'Money in', 'Money out']" :rows="rows" />
    </template>
  </UiCard>
</template>
