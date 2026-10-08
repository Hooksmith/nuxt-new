<script setup lang="ts">
import { LOAN_PRODUCTS, MAX_DEBT_TO_INCOME, monthlyPayment, type LoanProduct } from '#contracts'

const props = defineProps<{ product?: LoanProduct; amount?: number; termMonths?: number; monthlyIncome?: number }>()

const estimate = computed(() => {
  const { product, amount, termMonths, monthlyIncome } = props
  if (!product || !amount || !termMonths || amount <= 0) return null
  const { annualRate } = LOAN_PRODUCTS[product]
  const payment = monthlyPayment(Math.round(amount * 100), annualRate, termMonths)
  const total = payment * termMonths
  const ratio = monthlyIncome ? payment / 100 / monthlyIncome : null
  return { annualRate, payment, total, interest: total - amount * 100, ratio }
})
</script>

<template>
  <aside v-if="estimate" aria-label="Repayment estimate" class="rounded-xl bg-surface-muted p-4">
    <h3 class="text-sm font-semibold">Estimated repayments</h3>
    <dl class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <dt class="text-fg-muted">Monthly</dt>
        <dd class="text-lg font-bold tabular">{{ formatMoney({ amount: estimate.payment, currency: 'USD' }) }}</dd>
      </div>
      <div>
        <dt class="text-fg-muted">Interest rate</dt>
        <dd class="font-semibold tabular">{{ formatPercent(estimate.annualRate, 2) }} p.a.</dd>
      </div>
      <div>
        <dt class="text-fg-muted">Total interest</dt>
        <dd class="font-semibold tabular">{{ formatMoney({ amount: estimate.interest, currency: 'USD' }) }}</dd>
      </div>
      <div v-if="estimate.ratio !== null">
        <dt class="text-fg-muted">Share of income</dt>
        <dd
          class="font-semibold tabular"
          :class="{ 'text-red-700 dark:text-red-400': estimate.ratio > MAX_DEBT_TO_INCOME }"
        >
          {{ formatPercent(estimate.ratio, 0) }}
        </dd>
      </div>
    </dl>
    <p class="mt-3 text-xs text-fg-muted">Indicative only. Your final rate depends on our credit assessment.</p>
  </aside>
</template>
