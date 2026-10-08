<script setup lang="ts">
import { LOAN_APPLICATION_STEPS, type LoanApplicationStep } from '#contracts'

const props = defineProps<{ current: LoanApplicationStep; labels: Record<LoanApplicationStep, string> }>()
const currentIndex = computed(() => LOAN_APPLICATION_STEPS.indexOf(props.current))
</script>

<template>
  <ol aria-label="Application progress" class="grid grid-cols-4 gap-2">
    <li
      v-for="(step, index) in LOAN_APPLICATION_STEPS"
      :key="step"
      :aria-current="index === currentIndex ? 'step' : undefined"
      class="border-t-4 pt-2 text-xs sm:text-sm"
      :class="index <= currentIndex ? 'border-brand-600 text-fg' : 'border-border text-fg-muted'"
    >
      <span class="font-semibold">{{ index + 1 }}.</span>
      {{ labels[step] }}
      <span class="sr-only">{{
        index < currentIndex ? '(completed)' : index === currentIndex ? '(current step)' : ''
      }}</span>
    </li>
  </ol>
</template>
