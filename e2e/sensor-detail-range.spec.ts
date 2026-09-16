import { expect, test } from '@playwright/test'
import { SensorDetailPage } from './pages/SensorDetailPage'

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

test('applies a date range on the detail view and updates the readings table', async ({ page }) => {
  await page.goto('/sensors/sens-001')
  const detail = new SensorDetailPage(page)

  await expect(detail.chart).toBeVisible()
  await expect(detail.readingsCount).toHaveText(/Showing 50 of \d+/)
  await expect(detail.readingsRows).toHaveCount(50)

  const day = isoDaysAgo(10)
  await detail.applyDateRange(day, day)

  await expect(page).toHaveURL(new RegExp(`start=${day}&end=${day}`))
  await expect(detail.readingsCount).toHaveText('Showing 50 of 96')
  await expect(detail.readingsRows).toHaveCount(50)
  await expect(detail.chart).toBeVisible()
})
