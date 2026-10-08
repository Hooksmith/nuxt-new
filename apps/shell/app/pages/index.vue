<script setup lang="ts">
useSeoMeta({ title: 'Dashboard' })

const auth = useAuthStore()
const { data: dashboard, isPending: dashboardPending, isError, refetch } = useDashboardQuery()
const { data: loans, isPending: loansPending } = useLoansQuery()
const { data: accounts, isPending: accountsPending } = useAccountsQuery()

// Briefly highlight the row that just changed.
const highlightId = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | undefined
const { state: streamState } = useLoanStream({
  onEvent(event) {
    highlightId.value = event.loanId
    clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => (highlightId.value = null), 3000)
  },
})
onBeforeUnmount(() => clearTimeout(highlightTimer))

const firstName = computed(() => auth.user?.name.split(' ')[0] ?? '')
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold sm:text-3xl">Welcome back, {{ firstName }}</h1>
      <p class="mt-1 text-fg-muted">Here is an overview of your accounts, loans and credit health.</p>
    </div>

    <UiAlert v-if="isError" tone="danger" title="We couldn't load your analytics">
      <p>
        Your balances are safe.
        <button type="button" class="font-semibold underline" @click="refetch()">Try again</button>
      </p>
    </UiAlert>

    <DashboardKpiTiles :portfolio="dashboard?.portfolio" :loading="dashboardPending" />

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <DashboardCashflowCard :cashflow="dashboard?.portfolio.cashflow" :loading="dashboardPending" />
      </div>
      <DashboardCreditScoreCard :credit="dashboard?.creditScore" :loading="dashboardPending" />
    </div>

    <DashboardLoanPipeline
      :loans="loans"
      :loading="loansPending"
      :highlight-id="highlightId"
      :stream-state="streamState"
    />

    <UiCard title="Accounts">
      <template #actions>
        <NuxtLink to="/accounts" class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-100"
          >View all accounts</NuxtLink
        >
      </template>
      <AccountsAccountList :accounts="accounts" :loading="accountsPending" compact />
    </UiCard>
  </div>
</template>
