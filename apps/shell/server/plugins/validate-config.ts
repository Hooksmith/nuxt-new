/** Fail fast on misconfiguration instead of serving with an insecure default. */
export default defineNitroPlugin(() => {
  const { sessionPassword } = useRuntimeConfig()
  if (!sessionPassword || sessionPassword.length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD must be set to a random string of at least 32 characters.')
  }
})
