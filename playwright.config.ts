import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'bash backend/scripts/start-e2e-api.sh',
      url: 'http://127.0.0.1:8001/healthz',
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:8001',
      },
    },
  ],
})
