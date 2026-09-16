import { expect, test } from '@playwright/test'
import { SensorListPage } from './pages/SensorListPage'

test('paginates forward and back with a working page indicator', async ({ page }) => {
  const list = new SensorListPage(page)
  await list.goto()

  await list.pageSizeSelect.selectOption('10')
  await expect(list.rows).toHaveCount(10)
  await expect(list.summary).toHaveText('Showing 1–10 of 40')
  await expect(list.pageIndicator).toHaveText('Page 1 of 4')

  const firstPageFirstRow = await list.firstRowName()

  await list.nextButton.click()
  await expect(page).toHaveURL(/page=2/)
  await expect(list.pageIndicator).toHaveText('Page 2 of 4')
  await expect(list.summary).toHaveText('Showing 11–20 of 40')
  await expect(list.rows.first()).not.toContainText(firstPageFirstRow)

  await list.prevButton.click()
  await expect(list.pageIndicator).toHaveText('Page 1 of 4')
  await expect(list.summary).toHaveText('Showing 1–10 of 40')
  await expect(list.rows.first()).toContainText(firstPageFirstRow)
})
