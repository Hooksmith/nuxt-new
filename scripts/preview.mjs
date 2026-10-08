// Runs the production builds of both zones together (after `pnpm build`), like docker compose does.
import { spawn } from 'node:child_process'

const sessionPassword = process.env.NUXT_SESSION_PASSWORD ?? 'local-preview-only-session-password-0123456789'

const apps = [
  { name: 'loans', port: 3001, env: { NUXT_API_ORIGIN: 'http://localhost:3000' } },
  {
    name: 'shell',
    port: 3000,
    env: { NUXT_SESSION_PASSWORD: sessionPassword, NUXT_LOANS_ZONE_URL: 'http://localhost:3001' },
  },
]

for (const app of apps) {
  const child = spawn('node', [`apps/${app.name}/.output/server/index.mjs`], {
    env: { ...process.env, PORT: String(app.port), ...app.env },
    stdio: 'inherit',
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

console.warn('\n→ Open http://localhost:3000 (demo@bank.test / Password123!)\n')
