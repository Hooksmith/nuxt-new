<script setup lang="ts">
useSeoMeta({ title: 'Accounts' })
const { data: accounts, isPending, isError, error, refetch } = useAccountsQuery()
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold sm:text-3xl">Accounts</h1>
    <UiAlert v-if="isError" tone="danger" title="We couldn't load your accounts">
      {{ errorMessage(error) }}
      <button type="button" class="ml-1 font-semibold underline" @click="refetch()">Try again</button>
    </UiAlert>
    <UiCard>
      <AccountsAccountList :accounts="accounts" :loading="isPending" />
    </UiCard>
  </div>
</template>
