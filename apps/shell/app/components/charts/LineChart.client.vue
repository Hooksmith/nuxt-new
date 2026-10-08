<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler)

const props = defineProps<{
  labels: string[]
  data: number[]
  label: string
  /** Text alternative for the canvas (screen readers). */
  summary: string
  min?: number
  max?: number
}>()

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.data,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
    },
  ],
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: reducedMotion ? false : undefined,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
    y: { min: props.min, max: props.max, grid: { color: 'rgba(148,163,184,0.2)' }, ticks: { color: '#64748b' } },
  },
}))
</script>

<template>
  <div class="relative h-64">
    <Line :data="chartData" :options="options" :aria-label="summary" role="img" />
  </div>
</template>
