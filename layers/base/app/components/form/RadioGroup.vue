<script setup lang="ts">
import { useField } from 'vee-validate'

const props = withDefaults(
  defineProps<{
    name: string
    legend: string
    options: { value: string; label: string; description?: string }[]
    hint?: string
  }>(),
  { hint: undefined },
)

const { value, errorMessage, handleChange } = useField<string>(() => props.name, undefined, {
  validateOnValueUpdate: false,
})
const id = computed(() => `field-${props.name}`)
</script>

<template>
  <fieldset
    :aria-describedby="[hint && `${id}-hint`, errorMessage && `${id}-error`].filter(Boolean).join(' ') || undefined"
    :aria-invalid="!!errorMessage"
  >
    <legend class="text-sm font-medium">{{ legend }}</legend>
    <p v-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-fg-muted">{{ hint }}</p>
    <p v-if="errorMessage" :id="`${id}-error`" class="mt-1 text-sm font-medium text-red-700 dark:text-red-400">
      <span class="sr-only">Error:</span> {{ errorMessage }}
    </p>
    <div class="mt-2 grid gap-2 sm:grid-cols-2">
      <!-- The label stays short (the accessible name); the description is linked via aria-describedby. -->
      <div
        v-for="(option, index) in options"
        :key="option.value"
        class="relative flex gap-3 rounded-lg border p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus dark:has-[:checked]:bg-surface-muted"
        :class="errorMessage ? 'border-red-600' : 'border-border'"
      >
        <input
          :id="index === 0 ? id : `${id}-${option.value}`"
          type="radio"
          class="relative z-10 mt-1 size-4 accent-brand-600 focus-visible:outline-none"
          :name="name"
          :value="option.value"
          :checked="value === option.value"
          :aria-describedby="option.description ? `${id}-${option.value}-desc` : undefined"
          @change="handleChange(option.value, true)"
        />
        <div>
          <!-- after:absolute makes the whole card clickable -->
          <label
            :for="index === 0 ? id : `${id}-${option.value}`"
            class="block cursor-pointer text-sm font-medium after:absolute after:inset-0"
          >
            {{ option.label }}
          </label>
          <p v-if="option.description" :id="`${id}-${option.value}-desc`" class="text-xs text-fg-muted">
            {{ option.description }}
          </p>
        </div>
      </div>
    </div>
  </fieldset>
</template>
