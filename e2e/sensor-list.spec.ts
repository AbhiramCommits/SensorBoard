import { expect, test } from '@playwright/test'
import { SensorListPage } from './pages/SensorListPage'

test('filters by type and status and reflects them in the URL', async ({ page }) => {
  const list = new SensorListPage(page)
  await list.goto()
  await expect(list.rows).toHaveCount(25)

  await list.filterByType('temperature')
  await expect(list.rows).toHaveCount(10)
  await expect(page).toHaveURL(/type=temperature/)
  await expect(list.summary).toHaveText('Showing 1–10 of 10')

  await list.filterByStatus('online')
  await expect(list.rows).toHaveCount(6)
  await expect(page).toHaveURL(/type=temperature&status=online/)
  await expect(list.summary).toHaveText('Showing 1–6 of 6')

  await page.reload()
  await expect(list.typeSelect).toHaveValue('temperature')
  await expect(list.statusSelect).toHaveValue('online')
  await expect(list.rows).toHaveCount(6)
})
