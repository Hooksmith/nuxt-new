<script setup lang="ts">
// Lets E2E tests (and monitoring) know the page is interactive, not just server-rendered.
onMounted(() => {
  document.documentElement.dataset.hydrated = 'true'
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
