<script setup lang="ts">
import { useFormValues } from 'vee-validate'
import { LOAN_PRODUCTS, type LoanApplicationInput, type LoanProduct } from '#contracts'

const values = useFormValues<LoanApplicationInput>()

const productOptions = (Object.keys(LOAN_PRODUCTS) as LoanProduct[]).map((key) => ({
  value: key,
  label: LOAN_PRODUCTS[key].label,
  description: `From ${(LOAN_PRODUCTS[key].annualRate * 100).toFixed(2)}% p.a. · up to $${LOAN_PRODUCTS[key].maxAmount.toLocaleString('en-US')}`,
}))

const product = computed(() => values.value.product as LoanProduct | undefined)

const TERMS = [6, 12, 24, 36, 48, 60, 84, 120, 180, 240, 300, 360]
const termOptions = computed(() => {
  const product = LOAN_PRODUCTS[values.value.product as LoanProduct]
  return TERMS.filter((t) => !product || (t >= product.minTermMonths && t <= product.maxTermMonths)).map((t) => ({
    value: t,
    label: t % 12 === 0 ? `${t / 12} year${t === 12 ? '' : 's'} (${t} months)` : `${t} months`,
  }))
})
</script>

<template>
  <div class="space-y-5">
    <FormRadioGroup name="product" legend="What type of loan do you need?" :options="productOptions" />
    <div class="grid gap-5 sm:grid-cols-2">
      <FormTextField name="amount" label="Loan amount (USD)" type="number" inputmode="numeric" prefix="$" />
      <FormSelect name="termMonths" label="Repayment term" :options="termOptions" placeholder="Select a term" />
    </div>
    <FormTextField name="purpose" label="What will you use the loan for?" multiline hint="10–500 characters" />
    <ApplyRepaymentEstimate
      :product="product"
      :amount="Number(values.amount) || undefined"
      :term-months="Number(values.termMonths) || undefined"
      :monthly-income="Number(values.monthlyIncome) || undefined"
    />
  </div>
</template>
