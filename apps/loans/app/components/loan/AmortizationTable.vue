<script setup lang="ts">
import type { Loan } from '#contracts'

const props = defineProps<{ loan: Loan }>()
const showAll = ref(false)

const schedule = computed(() =>
  amortizationSchedule(props.loan.principal.amount, props.loan.annualRate, props.loan.termMonths),
)
const visible = computed(() => (showAll.value ? schedule.value : schedule.value.slice(0, 12)))
const interest = computed(() => totalInterest(schedule.value))
const usd = (amount: number) => formatMoney({ amount, currency: 'USD' })
</script>

<template>
  <div>
    <p class="mb-3 text-sm text-fg-muted">
      Total interest over {{ loan.termMonths }} months: <strong class="text-fg tabular">{{ usd(interest) }}</strong>
    </p>
    <div class="max-h-[28rem] overflow-auto">
      <table class="w-full text-right text-sm">
        <caption class="sr-only">
          Repayment schedule,
          {{
            showAll ? 'all' : 'first 12'
          }}
          instalments
        </caption>
        <thead class="sticky top-0 bg-surface">
          <tr class="border-b border-border text-fg-muted">
            <th scope="col" class="py-2 pr-4 text-left font-medium">Month</th>
            <th scope="col" class="py-2 pr-4 font-medium">Payment</th>
            <th scope="col" class="py-2 pr-4 font-medium">Principal</th>
            <th scope="col" class="py-2 pr-4 font-medium">Interest</th>
            <th scope="col" class="py-2 font-medium">Balance</th>
          </tr>
        </thead>
        <tbody class="tabular">
          <tr v-for="row in visible" :key="row.period" class="border-b border-border last:border-0">
            <th scope="row" class="py-1.5 pr-4 text-left font-normal">{{ row.period }}</th>
            <td class="py-1.5 pr-4">{{ usd(row.payment) }}</td>
            <td class="py-1.5 pr-4">{{ usd(row.principal) }}</td>
            <td class="py-1.5 pr-4">{{ usd(row.interest) }}</td>
            <td class="py-1.5">{{ usd(row.balance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiButton
      v-if="schedule.length > 12"
      variant="ghost"
      size="sm"
      class="mt-3"
      :aria-expanded="showAll"
      @click="showAll = !showAll"
    >
      {{ showAll ? 'Show first 12 months' : `Show all ${schedule.length} months` }}
    </UiButton>
  </div>
</template>
