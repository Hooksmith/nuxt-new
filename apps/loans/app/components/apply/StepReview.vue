<script setup lang="ts">
import { useFormValues } from 'vee-validate'
import { LOAN_PRODUCTS, type LoanApplicationInput, type LoanApplicationStep, type LoanProduct } from '#contracts'

const emit = defineEmits<{ edit: [step: LoanApplicationStep] }>()
const values = useFormValues<LoanApplicationInput>()

const employment: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  retired: 'Retired',
  unemployed: 'Not currently working',
}

const sections = computed(() => {
  const v = values.value
  return [
    {
      step: 'personal' as const,
      title: 'Personal details',
      rows: [
        ['Full name', v.fullName],
        ['Email', v.email],
        ['Mobile', v.phone],
        ['National ID', v.nationalId ? `•••••${String(v.nationalId).slice(-4)}` : ''],
        ['Date of birth', v.dateOfBirth],
      ],
    },
    {
      step: 'employment' as const,
      title: 'Employment and income',
      rows: [
        ['Status', employment[String(v.employmentStatus)] ?? ''],
        ['Employer', v.employerName || '—'],
        [
          'Monthly income',
          v.monthlyIncome ? formatMoney({ amount: Number(v.monthlyIncome) * 100, currency: 'USD' }) : '',
        ],
      ],
    },
    {
      step: 'loan' as const,
      title: 'Loan',
      rows: [
        ['Product', LOAN_PRODUCTS[v.product as LoanProduct]?.label ?? ''],
        ['Amount', v.amount ? formatMoney({ amount: Number(v.amount) * 100, currency: 'USD' }) : ''],
        ['Term', v.termMonths ? `${v.termMonths} months` : ''],
        ['Purpose', v.purpose],
      ],
    },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <section v-for="section in sections" :key="section.step" class="rounded-xl border border-border p-4">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-semibold">{{ section.title }}</h3>
        <UiButton variant="ghost" size="sm" @click="emit('edit', section.step)">
          Change<span class="sr-only"> {{ section.title.toLowerCase() }}</span>
        </UiButton>
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
        <template v-for="[label, value] in section.rows" :key="label">
          <dt class="text-fg-muted">{{ label }}</dt>
          <dd class="break-words">{{ value }}</dd>
        </template>
      </dl>
    </section>

    <fieldset class="space-y-3">
      <legend class="mb-2 font-semibold">Declarations</legend>
      <FormCheckbox
        name="agreeTerms"
        label="I confirm the information is accurate and accept the loan terms and conditions."
      />
      <FormCheckbox
        name="consentCreditCheck"
        label="I consent to the bank checking my credit history with Credit Bureau Cambodia."
      />
    </fieldset>
  </div>
</template>
