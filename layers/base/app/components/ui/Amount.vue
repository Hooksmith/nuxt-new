<script setup lang="ts">
import type { Money } from '#contracts'

/** Renders money, respecting the customer's "hide balances" privacy preference. */
const props = withDefaults(defineProps<{ money: Money; sensitive?: boolean; signed?: boolean }>(), {
  sensitive: true,
  signed: false,
})
const preferences = usePreferencesStore()
const hidden = computed(() => props.sensitive && preferences.hideBalances)
const formatted = computed(() => formatMoney(props.money, { signed: props.signed }))
</script>

<template>
  <span class="tabular">
    <template v-if="hidden">
      <span aria-hidden="true">••••••</span>
      <span class="sr-only">Amount hidden</span>
    </template>
    <template v-else>{{ formatted }}</template>
  </span>
</template>
