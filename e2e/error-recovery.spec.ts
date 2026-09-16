import { expect, test } from '@playwright/test'
import { SensorListPage } from './pages/SensorListPage'

test('shows an error banner on API failure and recovers via Retry', async ({ page }) => {
  await page.route('**/api/sensors*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'boom' }),
    }),
  )

  const list = new SensorListPage(page)
  await list.goto()

  await expect(list.errorBanner).toBeVisible()
  await expect(list.errorBanner).toContainText('Failed to load sensors')
  await expect(list.errorBanner).toContainText('boom')

  await page.unroute('**/api/sensors*')
  await list.errorBanner.getByRole('button', { name: 'Retry' }).click()

  await expect(list.errorBanner).toBeHidden()
  await expect(list.rows).toHaveCount(25)
})
