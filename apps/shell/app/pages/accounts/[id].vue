<script setup lang="ts">
import type { TransactionQuery } from '#contracts'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => String(route.params.id))

const accountQuery = useAccountQuery(accountId)
const { data: account, isPending: accountPending } = accountQuery
useNotFoundGuard(accountQuery, 'Account not found')
useSeoMeta({ title: () => account.value?.name ?? 'Account' })

// Filters live in the URL so they survive refreshes and can be shared/bookmarked.
const TYPES = ['all', 'credit', 'debit'] as const
const filters = computed<TransactionQuery>(() => ({
  page: Math.max(1, Number(route.query.page) || 1),
  pageSize: 15,
  type: TYPES.find((t) => t === route.query.type) ?? 'all',
  search: typeof route.query.search === 'string' ? route.query.search.slice(0, 64) : '',
}))

function updateFilters(patch: Partial<Record<'page' | 'type' | 'search', string | number | undefined>>) {
  // Keep URLs clean: drop default values.
  const query = Object.fromEntries(
    Object.entries({ ...route.query, ...patch }).filter(
      ([, v]) => v !== '' && v !== 'all' && v !== 1 && v !== undefined,
    ),
  )
  void router.replace({ query: query as Record<string, string> })
}

const searchInput = ref(filters.value.search ?? '')
let debounce: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => updateFilters({ search: value.trim(), page: undefined }), 300)
})
onBeforeUnmount(() => clearTimeout(debounce))

const {
  data: transactions,
  isPending,
  isFetching,
  isPlaceholderData,
  isError,
  refetch,
} = useTransactionsQuery(accountId, filters)

const resultSummary = computed(() => {
  if (!transactions.value) return ''
  const { total, page, totalPages } = transactions.value
  return `${total} transaction${total === 1 ? '' : 's'} · page ${page} of ${totalPages}`
})
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/accounts" class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-100">
      <span aria-hidden="true">←</span> All accounts
    </NuxtLink>

    <div v-if="accountPending"><UiSkeleton class="h-20 w-80" /></div>
    <div v-else-if="account" class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">{{ account.name }}</h1>
        <p class="text-fg-muted tabular">{{ account.maskedNumber }}</p>
      </div>
      <dl class="text-right">
        <dt class="text-sm text-fg-muted">Current balance</dt>
        <dd class="text-3xl font-bold"><UiAmount :money="account.balance" /></dd>
        <dt class="sr-only">Available balance</dt>
        <dd class="text-sm text-fg-muted">Available <UiAmount :money="account.availableBalance" /></dd>
      </dl>
    </div>

    <UiCard title="Transactions">
      <form class="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" role="search" @submit.prevent>
        <div>
          <label for="tx-search" class="sr-only">Search transactions</label>
          <input
            id="tx-search"
            v-model="searchInput"
            type="search"
            maxlength="64"
            placeholder="Search description or category"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </div>
        <div>
          <label for="tx-type" class="sr-only">Transaction type</label>
          <select
            id="tx-type"
            :value="filters.type"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2"
            @change="updateFilters({ type: ($event.target as HTMLSelectElement).value, page: undefined })"
          >
            <option value="all">All transactions</option>
            <option value="credit">Money in</option>
            <option value="debit">Money out</option>
          </select>
        </div>
      </form>

      <UiAlert v-if="isError" tone="danger">
        We couldn't load transactions.
        <button type="button" class="font-semibold underline" @click="refetch()">Try again</button>
      </UiAlert>
      <UiSkeleton v-else-if="isPending" class="h-80 w-full" />
      <template v-else-if="transactions">
        <p class="mb-2 flex items-center gap-2 text-sm text-fg-muted" role="status">
          {{ resultSummary }}
          <UiSpinner v-if="isFetching && isPlaceholderData" class="size-4" label="Loading" />
        </p>
        <div :class="{ 'opacity-60': isPlaceholderData }" class="transition-opacity">
          <AccountsTransactionTable
            v-if="transactions.items.length"
            :transactions="transactions.items"
            :caption="`Transactions for ${account?.name ?? 'account'}, ${resultSummary}`"
          />
          <p v-else class="py-8 text-center text-fg-muted">No transactions match your filters.</p>
        </div>
        <div class="mt-4">
          <UiPagination
            :page="transactions.page"
            :total-pages="transactions.totalPages"
            label="Transactions pages"
            @update:page="updateFilters({ page: $event })"
          />
        </div>
      </template>
    </UiCard>
  </div>
</template>
