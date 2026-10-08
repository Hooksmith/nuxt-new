<script setup lang="ts">
import { CREDIT_SCORE_MAX, CREDIT_SCORE_MIN, type CreditBand } from '#contracts'

const props = defineProps<{ score: number; band: CreditBand }>()

const percent = computed(() =>
  Math.min(100, Math.max(0, ((props.score - CREDIT_SCORE_MIN) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100)),
)
const color = computed(
  () =>
    ({ Poor: '#dc2626', Fair: '#d97706', Good: '#16a34a', 'Very good': '#15803d', Excellent: '#2563eb' })[props.band],
)
</script>

<template>
  <figure class="flex flex-col items-center">
    <svg
      viewBox="0 0 200 115"
      class="w-full max-w-60"
      role="img"
      :aria-label="`Credit score ${score} out of ${CREDIT_SCORE_MAX}, rated ${band}`"
    >
      <path
        d="M 15 100 A 85 85 0 0 1 185 100"
        fill="none"
        stroke="var(--surface-muted)"
        stroke-width="16"
        stroke-linecap="round"
      />
      <path
        d="M 15 100 A 85 85 0 0 1 185 100"
        fill="none"
        :stroke="color"
        stroke-width="16"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="`${percent} 100`"
      />
      <text x="100" y="88" text-anchor="middle" class="fill-current text-4xl font-bold" style="font-size: 34px">
        {{ score }}
      </text>
      <text x="100" y="108" text-anchor="middle" class="fill-current" style="font-size: 11px; opacity: 0.7">
        {{ CREDIT_SCORE_MIN }}–{{ CREDIT_SCORE_MAX }}
      </text>
    </svg>
    <!-- Band colour is decorative (arc + dot); the text keeps full contrast. -->
    <figcaption class="mt-1 flex items-center gap-2 text-sm font-semibold">
      <span class="size-2.5 rounded-full" :style="{ backgroundColor: color }" aria-hidden="true" />
      {{ band }}
    </figcaption>
  </figure>
</template>
