<script setup lang="ts">
import { useFormValues } from 'vee-validate'
import type { LoanApplicationInput } from '#contracts'

const values = useFormValues<LoanApplicationInput>()
const needsEmployer = computed(() => ['employed', 'self_employed'].includes(String(values.value.employmentStatus)))

const options = [
  { value: 'employed', label: 'Employed', description: 'Salaried, full or part time' },
  { value: 'self_employed', label: 'Self-employed', description: 'Business owner or freelancer' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Not currently working' },
]
</script>

<template>
  <div class="space-y-5">
    <FormRadioGroup name="employmentStatus" legend="Employment status" :options="options" />
    <FormTextField
      v-if="needsEmployer"
      name="employerName"
      label="Employer or business name"
      autocomplete="organization"
    />
    <FormTextField
      name="monthlyIncome"
      label="Net monthly income (USD)"
      type="number"
      inputmode="decimal"
      prefix="$"
      hint="After tax. Include all regular income."
    />
  </div>
</template>
