import { HttpResponse, http } from 'msw'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SensorDetailPage } from './SensorDetailPage'
import { server } from '../test/handlers'
import { LocationProbe, renderWithProviders } from '../test/utils'

function renderDetail(route: string) {
  return renderWithProviders(
    <>
      <SensorDetailPage />
      <LocationProbe />
    </>,
    { route },
  )
}

function isoDayOffset(offsetDays: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

describe('SensorDetailPage', () => {
  it('renders metadata, chart and recent readings', async () => {
    renderDetail('/sensors/sens-001')

    expect(
      await screen.findByRole('heading', { name: 'Temperature Sensor 01' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
    expect(screen.getByText('sens-001')).toBeInTheDocument()
    expect(screen.getByText('Building A, Room 001')).toBeInTheDocument()
    expect(screen.getByText('°C')).toBeInTheDocument()

    const chart = await screen.findByRole('img', {
      name: /Line chart of Temperature Sensor 01 readings/,
    })
    expect(chart).toBeInTheDocument()

    expect(await screen.findByText('Showing 50 of 200')).toBeInTheDocument()
    expect(screen.getAllByRole('row').length).toBe(51)
  })

  it('keeps list filters in the back link and breadcrumb', async () => {
    renderDetail('/sensors/sens-001?type=temperature&status=online')

    await screen.findByRole('heading', { name: 'Temperature Sensor 01' })

    const backLink = screen.getByRole('link', { name: '← Back to list' })
    expect(backLink).toHaveAttribute('href', '/sensors?type=temperature&status=online')

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'Sensors' })).toHaveAttribute(
      'href',
      '/sensors?type=temperature&status=online',
    )
  })

  it('updates the readings when the date range changes', async () => {
    renderDetail('/sensors/sens-001')

    expect(await screen.findByText('Showing 50 of 200')).toBeInTheDocument()

    const yesterday = isoDayOffset(-1)
    fireEvent.change(screen.getByLabelText('From'), { target: { value: yesterday } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: yesterday } })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        `/sensors/sens-001?start=${yesterday}&end=${yesterday}`,
      )
    })
    expect(await screen.findByText('Showing 50 of 96')).toBeInTheDocument()
  })

  it('renders an empty state when the range has no readings', async () => {
    renderDetail(`/sensors/sens-001?start=${isoDayOffset(-30)}&end=${isoDayOffset(-30)}`)

    expect(await screen.findAllByText('No readings')).toHaveLength(2)
    expect(screen.getAllByText('No readings in the selected date range.')).toHaveLength(2)
  })

  it('shows an error banner when the sensor is missing', async () => {
    renderDetail('/sensors/sens-nope')

    const banner = (await screen.findAllByRole('alert'))[0]
    expect(banner).toBeDefined()
    expect(within(banner as HTMLElement).getByText('Failed to load sensor')).toBeInTheDocument()
  })

  it('shows an error banner for readings and recovers via Retry', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/sensors/:id/readings', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )
    renderDetail('/sensors/sens-001')

    const banner = (await screen.findAllByRole('alert'))[0]
    expect(banner).toBeDefined()
    expect(within(banner as HTMLElement).getByText('Failed to load readings')).toBeInTheDocument()
    expect(within(banner as HTMLElement).getByText('boom')).toBeInTheDocument()

    server.resetHandlers()
    await user.click(within(banner as HTMLElement).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Showing 50 of 200')).toBeInTheDocument()
  })
})
