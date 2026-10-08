import { joinURL } from 'ufo'

export type Zone = 'shell' | 'loans'

/**
 * Multi-zone routing helper. Links inside the current zone are client-side
 * navigations; links to another zone are full page loads that the ingress
 * routes to the owning app (same model as Next.js multi-zones).
 */
export function useZoneLink() {
  const config = useRuntimeConfig()
  const currentZone = config.public.zone as Zone

  function isSameZone(zone: Zone) {
    return zone === currentZone
  }

  function href(zone: Zone, path: string) {
    return joinURL(config.public.zones[zone], path)
  }

  /** Navigate anywhere in the platform, crossing zones when needed. */
  function navigate(zone: Zone, path: string, options: { replace?: boolean } = {}) {
    if (isSameZone(zone)) return navigateTo(path, options)
    return navigateTo(href(zone, path), { ...options, external: true })
  }

  /** Navigate to an absolute platform path such as `/loans/apply` or `/accounts`. */
  function navigateToPath(path: string, options: { replace?: boolean } = {}) {
    const zones = config.public.zones as Record<Zone, string>
    const owner = (Object.keys(zones) as Zone[]).find((zone) => {
      const base = zones[zone]
      return base !== '/' && (path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`))
    })
    if (!owner) return navigate('shell', path, options)
    return navigate(owner, path.slice(zones[owner].length) || '/', options)
  }

  return { currentZone, isSameZone, href, navigate, navigateToPath }
}
