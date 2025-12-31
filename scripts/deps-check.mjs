import { execSync } from 'node:child_process'

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: 'pipe' }).toString()
    return out
  } catch (e) {
    if (e.stdout) return e.stdout.toString()
    throw e
  }
}

const json = run('npm outdated --json')
if (!json.trim()) {
  console.log('No outdated packages')
  process.exit(0)
}
const data = JSON.parse(json)
const outdated = Object.entries(data)
  .map(([name, info]) => ({ name, ...info }))
const blocking = outdated.filter(p => p.wanted !== p.latest)
if (blocking.length) {
  console.error('Dependency stability check failed:')
  for (const p of blocking) {
    console.error(`${p.name}: current ${p.current}, wanted ${p.wanted}, latest ${p.latest}`)
  }
  process.exit(1)
}
console.log('Dependencies are up-to-date within allowed ranges')
