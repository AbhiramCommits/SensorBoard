import { expect, test, type Page } from '@playwright/test'
import { SensorDetailPage } from './pages/SensorDetailPage'
import { SensorListPage } from './pages/SensorListPage'

async function tabUntil(page: Page, predicate: () => boolean, maxTabs = 60): Promise<void> {
  for (let i = 0; i < maxTabs; i += 1) {
    if (await page.evaluate(predicate)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('Tab traversal never reached the target element')
}

test('reaches the filters and a table row with keyboard-only navigation', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard focus traversal is desktop-specific')

  const list = new SensorListPage(page)
  await list.goto()
  await expect(list.rows).toHaveCount(25)

  await tabUntil(page, () => document.activeElement?.id === 'sensor-search')
  await page.keyboard.type('temperature')
  await expect(page).toHaveURL(/q=temperature/)
  await expect(list.rows).toHaveCount(10)

  await tabUntil(
    page,
    () => document.activeElement?.classList.contains('sensor-table__row') ?? false,
  )
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/sensors\/sens-001\?/)
  const detail = new SensorDetailPage(page)
  await expect(detail.heading).toHaveText('Temperature Sensor 01')
  await expect(detail.chart).toBeVisible()
})
