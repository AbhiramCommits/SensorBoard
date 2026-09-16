// Regenerates the screenshots in docs/screenshots/ deterministically:
// boots a fresh seeded API on 127.0.0.1:8001 and a preview build on
// 127.0.0.1:4173, then captures list / detail / mobile / error views.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium, devices } from '@playwright/test'

const API_URL = 'http://127.0.0.1:8001/healthz'
const WEB_URL = 'http://127.0.0.1:4173'
const OUT_DIR = new URL('../docs/screenshots/', import.meta.url).pathname

const children = []

function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url)
        if (response.ok) return resolve()
      } catch {
        // not ready yet
      }
      if (Date.now() > deadline) {
        return reject(new Error(`Timed out waiting for ${url}`))
      }
      setTimeout(poll, 500)
    }
    poll()
  })
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', detached: true, ...options })
    child.on('error', reject)
    children.push(child)
    resolve({
      exit: () => new Promise((done) => child.on('exit', done)),
      kill: () => {
        try {
          process.kill(-child.pid, 'SIGTERM')
        } catch {
          // already gone
        }
      },
    })
  })
}

function cleanup() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // already gone
    }
  }
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const api = await run('bash', ['backend/scripts/start-e2e-api.sh'])
  const build = await run('npm', ['run', 'build'], {
    env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:8001' },
  })
  await build.exit()
  const web = await run('npm', [
    'run',
    'preview',
    '--',
    '--port',
    '4173',
    '--strictPort',
    '--host',
    '127.0.0.1',
  ])

  try {
    await waitForUrl(API_URL, 120_000)
    await waitForUrl(WEB_URL, 120_000)

    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

    await page.goto(`${WEB_URL}/sensors`)
    await page.locator('tr.sensor-table__row').first().waitFor()
    await page.screenshot({ path: `${OUT_DIR}/list.png`, fullPage: true })

    await page.goto(`${WEB_URL}/sensors/sens-001`)
    await page.getByRole('img', { name: /Line chart/ }).waitFor()
    await page.screenshot({ path: `${OUT_DIR}/detail.png`, fullPage: true })

    const mobile = await browser.newContext({ ...devices['Pixel 7'] })
    const mobilePage = await mobile.newPage()
    await mobilePage.goto(`${WEB_URL}/sensors`)
    await mobilePage.locator('tr.sensor-table__row').first().waitFor()
    await mobilePage.screenshot({ path: `${OUT_DIR}/mobile.png`, fullPage: true })
    await mobile.close()

    const errorPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await errorPage.route('**/api/sensors*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'boom' }),
      }),
    )
    await errorPage.goto(`${WEB_URL}/sensors`)
    await errorPage.getByRole('alert').waitFor()
    await errorPage.screenshot({ path: `${OUT_DIR}/error.png`, fullPage: true })

    await browser.close()
  } finally {
    api.kill()
    web.kill()
  }
}

main().catch((error) => {
  console.error(error)
  cleanup()
  process.exit(1)
})
