<script setup lang="ts">
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    name: string
    label: string
    options: { value: string | number; label: string }[]
    hint?: string
    placeholder?: string
  }>(),
  { hint: undefined, placeholder: 'Select an option' },
)

const { value, errorMessage, handleBlur, handleChange } = useField<string | number>(() => props.name, undefined, {
  validateOnValueUpdate: false,
})
const id = computed(() => `field-${props.name}`)
const describedBy = computed(
  () =>
    [props.hint && `${id.value}-hint`, errorMessage.value && `${id.value}-error`].filter(Boolean).join(' ') ||
    undefined,
)
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-medium">{{ label }}</label>
    <p v-if="hint" :id="`${id}-hint`" class="text-sm text-fg-muted">{{ hint }}</p>
    <select
      :id="id"
      :name="name"
      :value="value"
      class="block w-full rounded-lg border bg-surface px-3 py-2.5 text-fg shadow-sm"
      :class="errorMessage ? 'border-red-600' : 'border-border'"
      :aria-invalid="!!errorMessage"
      :aria-describedby="describedBy"
      aria-required="true"
      @change="handleChange($event, true)"
      @blur="handleBlur($event, true)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="errorMessage" :id="`${id}-error`" class="text-sm font-medium text-red-700 dark:text-red-400">
      <span class="sr-only">Error:</span> {{ errorMessage }}
    </p>
  </div>
</template>
