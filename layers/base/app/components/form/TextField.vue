<script setup lang="ts">
import { useField } from 'vee-validate'

/**
 * Text input bound to the surrounding vee-validate form (like a React Hook Form
 * <Controller>). Validates on blur, then live once the field has an error.
 */
const props = withDefaults(
  defineProps<{
    name: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date'
    hint?: string
    autocomplete?: string
    inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
    prefix?: string
    multiline?: boolean
    optional?: boolean
  }>(),
  {
    type: 'text',
    hint: undefined,
    autocomplete: 'off',
    inputmode: undefined,
    prefix: undefined,
    multiline: false,
    optional: false,
  },
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
const inputClass = computed(() => [
  'block w-full rounded-lg border bg-surface px-3 py-2.5 text-fg shadow-sm placeholder:text-fg-muted',
  errorMessage.value ? 'border-red-600' : 'border-border',
  props.prefix && 'pl-8',
])
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-medium">
      {{ label }}
      <span v-if="optional" class="font-normal text-fg-muted">(optional)</span>
    </label>
    <p v-if="hint" :id="`${id}-hint`" class="text-sm text-fg-muted">{{ hint }}</p>
    <div class="relative">
      <span
        v-if="prefix"
        class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-muted"
        aria-hidden="true"
      >
        {{ prefix }}
      </span>
      <textarea
        v-if="multiline"
        :id="id"
        :name="name"
        :value="value"
        rows="4"
        :class="inputClass"
        :aria-invalid="!!errorMessage"
        :aria-describedby="describedBy"
        :aria-required="!optional"
        @input="handleChange($event, !!errorMessage)"
        @blur="handleBlur($event, true)"
      />
      <input
        v-else
        :id="id"
        :name="name"
        :type="type"
        :value="value"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :class="inputClass"
        :aria-invalid="!!errorMessage"
        :aria-describedby="describedBy"
        :aria-required="!optional"
        @input="handleChange($event, !!errorMessage)"
        @blur="handleBlur($event, true)"
      />
    </div>
    <p v-if="errorMessage" :id="`${id}-error`" class="text-sm font-medium text-red-700 dark:text-red-400">
      <span class="sr-only">Error:</span> {{ errorMessage }}
    </p>
  </div>
</template>
