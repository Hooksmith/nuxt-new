<script setup lang="ts">
import type { Transaction } from '#contracts'

defineProps<{ transactions: Transaction[]; caption: string }>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr class="border-b border-border text-fg-muted">
          <th scope="col" class="py-2 pr-4 font-medium">Date</th>
          <th scope="col" class="py-2 pr-4 font-medium">Description</th>
          <th scope="col" class="hidden py-2 pr-4 font-medium sm:table-cell">Category</th>
          <th scope="col" class="py-2 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tx in transactions" :key="tx.id" class="border-b border-border last:border-0">
          <td class="py-2.5 pr-4 whitespace-nowrap text-fg-muted">{{ formatDate(tx.bookedAt) }}</td>
          <td class="py-2.5 pr-4">
            {{ tx.description }}
            <UiBadge v-if="tx.status === 'pending'" tone="warning" class="ml-1">Pending</UiBadge>
          </td>
          <td class="hidden py-2.5 pr-4 text-fg-muted sm:table-cell">{{ tx.category }}</td>
          <td
            class="py-2.5 text-right font-medium whitespace-nowrap"
            :class="tx.type === 'credit' ? 'text-green-700 dark:text-green-400' : ''"
          >
            <span class="sr-only">{{ tx.type === 'credit' ? 'Credit' : 'Debit' }}</span>
            <UiAmount
              :money="{ ...tx.amount, amount: tx.type === 'credit' ? tx.amount.amount : -tx.amount.amount }"
              signed
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
