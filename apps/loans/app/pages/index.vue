<script setup lang="ts">
import { LOAN_PRODUCTS, LOAN_STATUSES, LOAN_STATUS_LABELS, type LoanListQuery } from '#contracts'

useSeoMeta({ title: 'Loans' })

const route = useRoute()
const router = useRouter()

const status = computed<LoanListQuery['status']>(() => LOAN_STATUSES.find((s) => s === route.query.status) ?? 'all')
const filters = computed<LoanListQuery>(() => ({ status: status.value }))
const { data: loans, isPending, isError, error, refetch, isFetching } = useLoansQuery(filters)
const { state: streamState } = useLoanStream()

const filterOptions = [
  { value: 'all', label: 'All' },
  ...LOAN_STATUSES.map((s) => ({ value: s, label: LOAN_STATUS_LABELS[s] })),
]

function setStatus(value: string) {
  void router.replace({ query: value === 'all' ? {} : { status: value } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Your loans</h1>
        <p class="mt-1 flex items-center gap-3 text-fg-muted">
          Applications and active loans
          <AppLiveIndicator :state="streamState" />
        </p>
      </div>
      <UiButton to="/apply">Apply for a loan</UiButton>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label for="status-filter" class="text-sm font-medium">Show</label>
      <select
        id="status-filter"
        :value="status"
        class="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        @change="setStatus(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="option in filterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <UiSpinner v-if="isFetching && !isPending" class="size-4" label="Updating list" />
    </div>

    <UiAlert v-if="isError" tone="danger">
      {{ errorMessage(error) }}
      <button type="button" class="font-semibold underline" @click="refetch()">Try again</button>
    </UiAlert>

    <ul v-else-if="isPending" class="grid gap-4 md:grid-cols-2" aria-busy="true">
      <li v-for="i in 4" :key="i"><UiSkeleton class="h-40 w-full" /></li>
    </ul>

    <div v-else-if="loans && loans.length === 0" class="rounded-xl border border-dashed border-border p-10 text-center">
      <p class="font-medium">No loans to show</p>
      <p class="mt-1 text-sm text-fg-muted">Try a different filter or start a new application.</p>
    </div>

    <ul v-else class="grid gap-4 md:grid-cols-2">
      <li v-for="loan in loans" :key="loan.id">
        <NuxtLink
          :to="`/${loan.id}`"
          class="block h-full rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold">{{ LOAN_PRODUCTS[loan.product].label }}</p>
              <p class="text-sm text-fg-muted tabular">{{ loan.reference }}</p>
            </div>
            <LoanStatusBadge :status="loan.status" />
          </div>
          <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt class="text-fg-muted">Amount</dt>
              <dd class="font-semibold"><UiAmount :money="loan.principal" /></dd>
            </div>
            <div>
              <dt class="text-fg-muted">Monthly</dt>
              <dd class="font-semibold"><UiAmount :money="loan.monthlyPayment" /></dd>
            </div>
            <div>
              <dt class="text-fg-muted">Term</dt>
              <dd class="font-semibold">{{ loan.termMonths }} mo</dd>
            </div>
          </dl>
          <p class="mt-3 line-clamp-1 text-sm text-fg-muted">{{ loan.purpose }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
