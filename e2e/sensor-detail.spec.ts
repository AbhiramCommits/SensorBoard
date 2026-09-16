import { expect, test } from '@playwright/test'
import { SensorDetailPage } from './pages/SensorDetailPage'
import { SensorListPage } from './pages/SensorListPage'

test('opens a sensor detail, verifies metadata and chart, and back preserves filters', async ({
  page,
}) => {
  const list = new SensorListPage(page)
  await list.goto()
  await list.filterByType('temperature')
  await expect(list.rows).toHaveCount(10)

  await list.openSensor('Temperature Sensor 01')

  await expect(page).toHaveURL(/\/sensors\/sens-001\?type=temperature/)
  const detail = new SensorDetailPage(page)
  await expect(detail.heading).toHaveText('Temperature Sensor 01')
  await expect(detail.metadata).toContainText('sens-001')
  await expect(detail.metadata).toContainText('Building A, Room 001')
  await expect(detail.metadata).toContainText('°C')
  await expect(detail.metadata).toContainText('online')
  await expect(detail.chart).toBeVisible()
  await expect(detail.chart.locator('svg')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/sensors\?type=temperature/)
  await expect(list.typeSelect).toHaveValue('temperature')
  await expect(list.rows).toHaveCount(10)
})
