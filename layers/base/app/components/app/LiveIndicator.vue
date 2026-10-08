<script setup lang="ts">
const props = defineProps<{ state: 'connecting' | 'live' | 'reconnecting' }>()
const label = computed(() => ({ connecting: 'Connecting…', live: 'Live', reconnecting: 'Reconnecting…' })[props.state])
</script>

<template>
  <span class="inline-flex items-center gap-2 text-xs font-medium text-fg-muted">
    <span class="relative flex size-2.5" aria-hidden="true">
      <span
        v-if="state === 'live'"
        class="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75"
      />
      <span
        class="relative inline-flex size-2.5 rounded-full"
        :class="state === 'live' ? 'bg-green-500' : 'bg-amber-500'"
      />
    </span>
    {{ label }}
  </span>
</template>
