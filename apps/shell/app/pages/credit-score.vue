<script setup lang="ts">
useSeoMeta({ title: 'Credit score' })
const { data: credit, isPending, isError, refetch } = useCreditScoreQuery()

const impactTone = { positive: 'success', neutral: 'neutral', negative: 'danger' } as const
const impactLabel = { positive: 'Helping', neutral: 'Neutral', negative: 'Hurting' } as const

const rows = computed(() => credit.value?.history.map((p) => [formatMonth(p.month), p.score]) ?? [])
const change = computed(() => {
  const history = credit.value?.history
  if (!history || history.length < 2) return 0
  return history.at(-1)!.score - history[0]!.score
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold sm:text-3xl">Credit score</h1>

    <UiAlert v-if="isError" tone="danger">
      We couldn't load your credit report.
      <button type="button" class="font-semibold underline" @click="refetch()">Try again</button>
    </UiAlert>

    <div class="grid gap-6 lg:grid-cols-3">
      <UiCard title="Your score">
        <UiSkeleton v-if="isPending" class="mx-auto h-36 w-56" />
        <template v-else-if="credit">
          <CreditScoreGauge :score="credit.current" :band="credit.band" />
          <p class="mt-3 text-center text-sm text-fg-muted">
            <span :class="change >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700'">
              {{ change >= 0 ? '+' : '' }}{{ change }} points
            </span>
            in the last 12 months
          </p>
        </template>
      </UiCard>

      <div class="lg:col-span-2">
        <UiCard title="12-month trend">
          <UiSkeleton v-if="isPending" class="h-64 w-full" />
          <template v-else-if="credit">
            <ClientOnly>
              <LazyChartsLineChart
                :labels="credit.history.map((p) => formatMonth(p.month))"
                :data="credit.history.map((p) => p.score)"
                label="Credit score"
                :min="600"
                :max="850"
                summary="Line chart of your credit score over the last 12 months. Data table available below."
              />
              <template #fallback><UiSkeleton class="h-64 w-full" /></template>
            </ClientOnly>
            <UiDataTable caption="Credit score by month" :columns="['Month', 'Score']" :rows="rows" />
          </template>
        </UiCard>
      </div>
    </div>

    <UiCard v-if="credit" title="What affects your score">
      <ul class="divide-y divide-border">
        <li
          v-for="factor in credit.factors"
          :key="factor.label"
          class="flex flex-wrap items-start justify-between gap-2 py-3"
        >
          <div>
            <p class="font-medium">{{ factor.label }}</p>
            <p class="text-sm text-fg-muted">{{ factor.detail }}</p>
          </div>
          <UiBadge :tone="impactTone[factor.impact]">{{ impactLabel[factor.impact] }}</UiBadge>
        </li>
      </ul>
    </UiCard>
  </div>
</template>
