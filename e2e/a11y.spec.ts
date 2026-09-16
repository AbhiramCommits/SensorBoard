import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SensorDetailPage } from './pages/SensorDetailPage'
import { SensorListPage } from './pages/SensorListPage'

interface AxeViolation {
  impact?: string
}

test('list page has no serious or critical accessibility violations', async ({ page }) => {
  const list = new SensorListPage(page)
  await list.goto()
  await expect(list.rows).toHaveCount(25)

  const results = await new AxeBuilder({ page }).analyze()
  const violations = (results.violations as AxeViolation[]).filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(violations).toEqual([])
})

test('detail page has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/sensors/sens-001')
  const detail = new SensorDetailPage(page)
  await expect(detail.chart).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  const violations = (results.violations as AxeViolation[]).filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(violations).toEqual([])
})
