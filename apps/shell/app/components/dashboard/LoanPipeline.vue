<script setup lang="ts">
import { LOAN_PRODUCTS, type Loan } from '#contracts'

const props = defineProps<{
  loans?: Loan[]
  loading: boolean
  highlightId?: string | null
  streamState: 'connecting' | 'live' | 'reconnecting'
}>()
const { href } = useZoneLink()
const recent = computed(() => props.loans?.slice(0, 6) ?? [])
</script>

<template>
  <UiCard title="Loan applications" description="Status updates arrive in real time from underwriting">
    <template #actions>
      <AppLiveIndicator :state="streamState" />
    </template>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <caption class="sr-only">
          Your most recent loan applications and their status
        </caption>
        <thead>
          <tr class="border-b border-border text-fg-muted">
            <th scope="col" class="py-2 pr-4 font-medium">Reference</th>
            <th scope="col" class="py-2 pr-4 font-medium">Product</th>
            <th scope="col" class="py-2 pr-4 text-right font-medium">Amount</th>
            <th scope="col" class="py-2 pr-4 font-medium">Status</th>
            <th scope="col" class="py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 4" :key="i">
              <td colspan="5" class="py-2"><UiSkeleton class="h-6 w-full" /></td>
            </tr>
          </template>
          <tr
            v-for="loan in recent"
            v-else
            :key="loan.id"
            class="border-b border-border transition-colors duration-700 last:border-0"
            :class="{ 'bg-brand-50 dark:bg-surface-muted': loan.id === highlightId }"
          >
            <td class="py-2.5 pr-4 font-medium">
              <a
                :href="href('loans', `/${loan.id}`)"
                class="text-brand-700 underline-offset-2 hover:underline dark:text-brand-100"
                >{{ loan.reference }}</a
              >
            </td>
            <td class="py-2.5 pr-4">{{ LOAN_PRODUCTS[loan.product].label }}</td>
            <td class="py-2.5 pr-4 text-right"><UiAmount :money="loan.principal" /></td>
            <td class="py-2.5 pr-4"><LoanStatusBadge :status="loan.status" /></td>
            <td class="py-2.5 text-fg-muted">{{ formatDateTime(loan.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiCard>
</template>
