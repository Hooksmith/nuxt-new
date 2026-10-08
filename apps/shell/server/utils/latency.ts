/** Simulates core-banking latency so loading states are visible in the demo. */
export function simulateLatency(min = 80, max = 300): Promise<void> {
  if (process.env.VITEST) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))
}
