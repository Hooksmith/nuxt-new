<script setup lang="ts">
const props = withDefaults(defineProps<{ title?: string; description?: string; headingLevel?: 2 | 3 }>(), {
  title: undefined,
  description: undefined,
  headingLevel: 2,
})
// Deterministic id from the title: `useId()` differs between SSR and client when a page
// prefetches on the server (extra async boundary), which breaks hydration.
const id = computed(() => (props.title ? `card-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined))
</script>

<template>
  <section class="rounded-xl border border-border bg-surface p-5 shadow-sm" :aria-labelledby="title ? id : undefined">
    <header v-if="title || $slots.actions" class="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <component :is="`h${headingLevel}`" v-if="title" :id="id" class="text-base font-semibold">{{
          title
        }}</component>
        <p v-if="description" class="text-sm text-fg-muted">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
