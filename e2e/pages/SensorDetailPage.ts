import type { Locator, Page } from '@playwright/test'

export class SensorDetailPage {
  readonly page: Page
  readonly heading: Locator
  readonly metadata: Locator
  readonly chart: Locator
  readonly fromDate: Locator
  readonly toDate: Locator
  readonly readingsRows: Locator
  readonly readingsCount: Locator
  readonly backLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1.sensor-detail__title')
    this.metadata = page.locator('.metadata')
    this.chart = page.getByRole('img', { name: /Line chart/ })
    this.fromDate = page.locator('#readings-start')
    this.toDate = page.locator('#readings-end')
    this.readingsRows = page.locator('table.readings-table tbody tr')
    this.readingsCount = page.locator('.recent-card__count')
    this.backLink = page.getByRole('link', { name: '← Back to list' })
  }

  async applyDateRange(start: string, end: string) {
    await this.fromDate.fill(start)
    await this.toDate.fill(end)
  }
}
