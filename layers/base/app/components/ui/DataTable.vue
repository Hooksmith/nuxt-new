<script setup lang="ts">
/** Accessible tabular fallback for charts (screen readers can't read a canvas). */
defineProps<{ caption: string; columns: string[]; rows: (string | number)[][] }>()
</script>

<template>
  <details class="mt-3 text-sm">
    <summary class="cursor-pointer text-brand-700 dark:text-brand-100">View data as a table</summary>
    <div class="mt-2 overflow-x-auto">
      <table class="w-full text-left">
        <caption class="sr-only">
          {{
            caption
          }}
        </caption>
        <thead>
          <tr class="border-b border-border">
            <th v-for="column in columns" :key="column" scope="col" class="py-2 pr-4 font-medium">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i" class="border-b border-border last:border-0">
            <td v-for="(cell, j) in row" :key="j" class="py-1.5 pr-4 tabular">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </details>
</template>
