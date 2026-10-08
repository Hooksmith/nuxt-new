<script setup lang="ts">
import type { RouteLocationRaw } from '#vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    to?: RouteLocationRaw
  }>(),
  { variant: 'primary', size: 'md', type: 'button', loading: false, disabled: false, to: undefined },
)

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-60',
  props.size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
  {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
    ghost: 'text-brand-700 hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-surface-muted',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[props.variant],
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes"><slot /></NuxtLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <UiSpinner v-if="loading" class="size-4" />
    <slot />
  </button>
</template>
