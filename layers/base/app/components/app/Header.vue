<script setup lang="ts">
const appConfig = useAppConfig()
const auth = useAuthStore()
const preferences = usePreferencesStore()
const { isSameZone } = useZoneLink()
const route = useRoute()
const menuOpen = ref(false)

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)

function isActive(item: { zone: 'shell' | 'loans'; to: string }) {
  if (!isSameZone(item.zone)) return false
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}
</script>

<template>
  <header class="border-b border-border bg-surface">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <ZoneLink zone="shell" to="/" class="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-100">
        <svg viewBox="0 0 24 24" class="size-7" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2 2 7v2h20V7L12 2Zm-7 9v7h3v-7H5Zm5.5 0v7h3v-7h-3Zm5.5 0v7h3v-7h-3ZM2 20v2h20v-2H2Z"
          />
        </svg>
        <span>{{ appConfig.brand }}</span>
      </ZoneLink>

      <button
        type="button"
        class="rounded-md p-2 md:hidden"
        aria-controls="primary-nav"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
        <svg viewBox="0 0 24 24" class="size-6" aria-hidden="true">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <nav
        id="primary-nav"
        aria-label="Primary"
        class="absolute inset-x-0 top-14 z-40 border-b border-border bg-surface p-4 md:static md:block md:border-0 md:p-0"
        :class="menuOpen ? 'block' : 'hidden'"
      >
        <ul class="flex flex-col gap-1 md:flex-row md:items-center">
          <li v-for="item in appConfig.nav" :key="`${item.zone}:${item.to}`">
            <ZoneLink
              :zone="item.zone"
              :to="item.to"
              class="block rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              :class="
                isActive(item)
                  ? 'bg-brand-50 text-brand-800 dark:bg-surface-muted dark:text-brand-100'
                  : 'text-fg-muted'
              "
              :aria-current="isActive(item) ? 'page' : undefined"
            >
              {{ item.label }}
            </ZoneLink>
          </li>
        </ul>
      </nav>

      <div v-if="auth.user" class="hidden items-center gap-3 md:flex">
        <UiButton
          variant="ghost"
          size="sm"
          :aria-pressed="preferences.hideBalances"
          @click="preferences.toggleBalances()"
        >
          {{ preferences.hideBalances ? 'Show balances' : 'Hide balances' }}
        </UiButton>
        <span class="text-sm text-fg-muted">
          <span class="sr-only">Signed in as</span>
          {{ auth.user.name }}
        </span>
        <UiButton variant="secondary" size="sm" @click="auth.logout()">Sign out</UiButton>
      </div>
    </div>
  </header>
</template>
