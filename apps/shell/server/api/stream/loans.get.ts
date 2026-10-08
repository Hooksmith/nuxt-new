/**
 * Server-Sent Events stream of loan status changes for the signed-in customer.
 * SSE (vs WebSockets) is one-way, works over plain HTTP/2, passes through the
 * ingress unchanged and reconnects automatically in the browser.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  setResponseHeader(event, 'x-accel-buffering', 'no')

  const stream = createEventStream(event)
  const unsubscribe = loanEvents.subscribe(user.id, (loanEvent) => {
    void stream.push({
      event: 'loan-status',
      id: `${loanEvent.loanId}:${loanEvent.at}`,
      data: JSON.stringify(loanEvent),
    })
  })
  // Heartbeat keeps proxies from closing idle connections.
  const heartbeat = setInterval(() => void stream.push({ event: 'ping', data: '{}' }), 25_000)

  stream.onClosed(async () => {
    clearInterval(heartbeat)
    unsubscribe()
    await stream.close()
  })

  return stream.send()
})
