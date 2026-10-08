<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppSkipLink />
    <AppHeader />
    <main id="main-content" tabindex="-1" class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 focus:outline-none sm:px-6">
      <slot />
    </main>
    <footer class="border-t border-border py-6 text-center text-xs text-fg-muted">
      Demo application · Deposits and loans shown are fictitious.
    </footer>
    <ClientOnly>
      <AppIdleDialog v-if="auth.isAuthenticated" />
    </ClientOnly>
  </div>
</template>
