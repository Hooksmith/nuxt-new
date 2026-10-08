<script setup lang="ts">
import type { Zone } from '../composables/useZoneLink'

/** A link that knows which micro-frontend (zone) owns its destination. */
const props = defineProps<{ zone: Zone; to: string }>()
const { isSameZone, href } = useZoneLink()
const sameZone = computed(() => isSameZone(props.zone))
</script>

<template>
  <NuxtLink v-if="sameZone" :to="to"><slot /></NuxtLink>
  <a v-else :href="href(zone, to)"><slot /></a>
</template>
