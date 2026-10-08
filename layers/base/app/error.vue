<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const title = computed(() => (props.error.statusCode === 404 ? 'Page not found' : 'Something went wrong'))
useSeoMeta({ title })

// Never leak stack traces or internal messages to customers.
const message = computed(() =>
  props.error.statusCode === 404
    ? 'The page you are looking for does not exist or has moved.'
    : 'We could not complete your request. Please try again in a moment.',
)
</script>

<template>
  <main id="main-content" class="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
    <p class="text-sm font-semibold text-brand-600">Error {{ error.statusCode }}</p>
    <h1 class="text-3xl font-bold">{{ title }}</h1>
    <p class="text-fg-muted">{{ message }}</p>
    <div>
      <UiButton @click="clearError({ redirect: '/' })">Go to start page</UiButton>
    </div>
  </main>
</template>
