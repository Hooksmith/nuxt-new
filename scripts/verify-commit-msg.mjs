// Enforces Conventional Commits (https://www.conventionalcommits.org) on every commit.
import { readFileSync } from 'node:fs'

const message = readFileSync(process.argv[2], 'utf8').split('\n')[0].trim()
const pattern = /^(feat|fix|perf|refactor|test|docs|build|ci|chore|revert|style)(\([\w./-]+\))?!?: .{1,100}$/

if (!pattern.test(message) && !message.startsWith('Merge ')) {
  console.error(`\n✖ Invalid commit message: "${message}"\n`)
  console.error('  Use Conventional Commits, e.g.')
  console.error('    feat(loans): add debt-to-income check to the application wizard')
  console.error('    fix(shell): keep transaction filters in the URL\n')
  process.exit(1)
}
