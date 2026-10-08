<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number; label?: string }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

/** Compact page list: 1 … 4 5 6 … 12 */
const pages = computed(() => {
  const { page, totalPages } = props
  const set = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages))
  const sorted = [...set].sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push('gap')
    result.push(p)
  })
  return result
})

const buttonClass =
  'min-w-10 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted disabled:opacity-50'
</script>

<template>
  <nav v-if="totalPages > 1" :aria-label="label ?? 'Pagination'" class="flex flex-wrap items-center gap-1">
    <button type="button" :class="buttonClass" :disabled="page <= 1" @click="emit('update:page', page - 1)">
      Previous<span class="sr-only"> page</span>
    </button>
    <template v-for="(item, index) in pages" :key="index">
      <span v-if="item === 'gap'" class="px-2 text-fg-muted" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        :class="[buttonClass, item === page && 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700']"
        :aria-current="item === page ? 'page' : undefined"
        @click="emit('update:page', item)"
      >
        <span class="sr-only">Page </span>{{ item }}
      </button>
    </template>
    <button type="button" :class="buttonClass" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">
      Next<span class="sr-only"> page</span>
    </button>
  </nav>
</template>
