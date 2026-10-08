<script setup lang="ts">
import { useField } from 'vee-validate'

const props = defineProps<{ name: string; label: string }>()

const { checked, errorMessage, handleChange } = useField<boolean>(() => props.name, undefined, {
  type: 'checkbox',
  checkedValue: true,
  uncheckedValue: false,
  validateOnValueUpdate: false,
})
const id = computed(() => `field-${props.name}`)
</script>

<template>
  <div>
    <div class="flex items-start gap-3">
      <input
        :id="id"
        type="checkbox"
        class="mt-0.5 size-5 accent-brand-600"
        :name="name"
        :checked="checked"
        :aria-invalid="!!errorMessage"
        :aria-describedby="errorMessage ? `${id}-error` : undefined"
        @change="handleChange($event, true)"
      />
      <label :for="id" class="text-sm">{{ label }}</label>
    </div>
    <p v-if="errorMessage" :id="`${id}-error`" class="mt-1 pl-8 text-sm font-medium text-red-700 dark:text-red-400">
      <span class="sr-only">Error:</span> {{ errorMessage }}
    </p>
  </div>
</template>
