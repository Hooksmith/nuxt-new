<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Tree-shaken registration: only the pieces this chart needs end up in the bundle.
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  datasets: { label: string; data: number[]; color: string }[]
  /** Text alternative for the canvas (screen readers). */
  summary: string
  formatValue?: (value: number) => string
}>()

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const format = (value: number) => props.formatValue?.(value) ?? String(value)

const data = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: props.datasets.map((d) => ({
    label: d.label,
    data: d.data,
    backgroundColor: d.color,
    borderRadius: 4,
    maxBarThickness: 28,
  })),
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: reducedMotion ? false : undefined,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#64748b', usePointStyle: true } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${format(ctx.parsed.y ?? 0)}` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { color: '#64748b', callback: (v) => format(Number(v)) } },
  },
}))
</script>

<template>
  <div class="relative h-64">
    <Bar :data="data" :options="options" :aria-label="summary" role="img" />
  </div>
</template>
