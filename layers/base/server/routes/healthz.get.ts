/** Liveness/readiness probe for Kubernetes. */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  return { status: 'ok', zone: useRuntimeConfig(event).public.zone, uptime: Math.round(process.uptime()) }
})
