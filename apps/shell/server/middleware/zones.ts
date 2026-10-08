/**
 * Local multi-zone routing. In Kubernetes the ingress sends `/loans/**` to the
 * loans app directly; without an ingress (dev, docker compose) the shell
 * proxies it so the whole platform is reachable on a single origin.
 */
export default defineEventHandler((event) => {
  const { loansZoneUrl } = useRuntimeConfig(event)
  if (!loansZoneUrl) return

  const path = event.path
  if (path === '/loans' || path.startsWith('/loans/') || path.startsWith('/loans?')) {
    return proxyRequest(event, new URL(path, loansZoneUrl).toString(), {
      // Pass redirects (e.g. to /login) through to the browser instead of following them here.
      fetchOptions: { redirect: 'manual' },
    })
  }
})
