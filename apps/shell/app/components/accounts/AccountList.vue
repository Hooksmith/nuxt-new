<script setup lang="ts">
import type { Account } from '#contracts'

defineProps<{ accounts?: Account[]; loading: boolean; compact?: boolean }>()

const typeLabel: Record<Account['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  term_deposit: 'Term deposit',
}
</script>

<template>
  <ul class="divide-y divide-border" :aria-busy="loading">
    <template v-if="loading">
      <li v-for="i in 3" :key="i" class="py-3"><UiSkeleton class="h-10 w-full" /></li>
    </template>
    <li v-for="account in accounts" v-else :key="account.id">
      <NuxtLink
        :to="`/accounts/${account.id}`"
        class="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 hover:bg-surface-muted"
      >
        <span>
          <span class="block font-medium">{{ account.name }}</span>
          <span class="block text-sm text-fg-muted">
            {{ typeLabel[account.type] }} · <span class="tabular">{{ account.maskedNumber }}</span>
          </span>
        </span>
        <span class="text-right">
          <span class="block font-semibold"><UiAmount :money="account.balance" /></span>
          <span v-if="!compact" class="block text-xs text-fg-muted">
            Available <UiAmount :money="account.availableBalance" />
          </span>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
