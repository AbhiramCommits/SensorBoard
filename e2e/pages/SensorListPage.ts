import type { Locator, Page } from '@playwright/test'

export class SensorListPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly typeSelect: Locator
  readonly statusSelect: Locator
  readonly fromDate: Locator
  readonly toDate: Locator
  readonly resetButton: Locator
  readonly rows: Locator
  readonly pageSizeSelect: Locator
  readonly nextButton: Locator
  readonly prevButton: Locator
  readonly summary: Locator
  readonly pageIndicator: Locator
  readonly errorBanner: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByLabel('Search')
    this.typeSelect = page.getByLabel('Type')
    this.statusSelect = page.getByLabel('Status')
    this.fromDate = page.getByLabel('From')
    this.toDate = page.getByLabel('To')
    this.resetButton = page.getByRole('button', { name: 'Reset', exact: true })
    this.rows = page.locator('tr.sensor-table__row')
    this.pageSizeSelect = page.getByLabel('Page size')
    this.nextButton = page.getByRole('button', { name: 'Next' })
    this.prevButton = page.getByRole('button', { name: 'Prev' })
    this.summary = page.locator('.pagination__summary')
    this.pageIndicator = page.locator('.pagination__indicator')
    this.errorBanner = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/sensors')
  }

  async filterByType(type: string) {
    await this.typeSelect.selectOption(type)
  }

  async filterByStatus(status: string) {
    await this.statusSelect.selectOption(status)
  }

  async firstRowName(): Promise<string> {
    return (await this.rows.first().locator('td').first().textContent()) ?? ''
  }

  async openSensor(name: string) {
    await this.rows.filter({ hasText: name }).click()
  }
}
