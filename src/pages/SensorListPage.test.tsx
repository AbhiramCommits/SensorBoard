import { HttpResponse, http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as clientModule from '../api/client'
import { SensorListPage } from './SensorListPage'
import { server } from '../test/handlers'
import { LocationProbe, renderWithProviders } from '../test/utils'

function renderList(route = '/sensors') {
  return renderWithProviders(
    <>
      <SensorListPage />
      <LocationProbe />
    </>,
    { route },
  )
}

describe('SensorListPage URL state', () => {
  it('reads filters from the query string', async () => {
    renderList('/sensors?q=temp&type=temperature&status=online')

    expect(await screen.findByLabelText('Search')).toHaveValue('temp')
    expect(screen.getByLabelText('Type')).toHaveValue('temperature')
    expect(screen.getByLabelText('Status')).toHaveValue('online')
    expect(await screen.findByText('Showing 1–3 of 3')).toBeInTheDocument()
  })

  it('shows the empty-page state when the requested page is out of range', async () => {
    renderList('/sensors?type=temperature&status=online&page=2&page_size=10')

    expect(await screen.findByText('No sensors on this page')).toBeInTheDocument()
  })

  it('writes filter changes to the query string', async () => {
    const user = userEvent.setup()
    renderList()

    await screen.findByText('Temperature Sensor 01')
    await user.selectOptions(screen.getByLabelText('Type'), 'temperature')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/sensors?type=temperature')
    })
    expect(screen.getByLabelText('Type')).toHaveValue('temperature')
  })

  it('writes pagination state to the query string', async () => {
    const user = userEvent.setup()
    renderList('/sensors?page_size=10')

    await screen.findByText('Temperature Sensor 01')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/sensors?page=2&page_size=10')
    })
  })
})

describe('SensorListPage pagination', () => {
  it('shows the first page with prev disabled', async () => {
    renderList('/sensors?page_size=10')

    await screen.findByText('Temperature Sensor 01')
    expect(screen.getByText('Showing 1–10 of 30')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(screen.getAllByRole('link', { name: /^View / })).toHaveLength(10)
  })

  it('moves forward and updates the rows', async () => {
    const user = userEvent.setup()
    renderList('/sensors?page_size=10')

    await screen.findByText('Temperature Sensor 01')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Pressure Sensor 11')).toBeInTheDocument()
    expect(screen.queryByText('Temperature Sensor 01')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 11–20 of 30')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  it('reaches the last page and disables next', async () => {
    const user = userEvent.setup()
    renderList('/sensors?page_size=10')

    await screen.findByText('Temperature Sensor 01')
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(await screen.findByText('Showing 21–30 of 30')).toBeInTheDocument()
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Prev' })).toBeEnabled()
  })

  it('resets to page 1 when a filter changes', async () => {
    const user = userEvent.setup()
    renderList('/sensors?page_size=10&page=3')

    await screen.findByText('Showing 21–30 of 30')
    await user.selectOptions(screen.getByLabelText('Status'), 'offline')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/sensors?status=offline&page_size=10',
      )
    })
    expect(await screen.findByText('Showing 1–10 of 10')).toBeInTheDocument()
  })

  it('recovers from an out-of-range page with the first-page action', async () => {
    const user = userEvent.setup()
    renderList('/sensors?page_size=10&page=999')

    expect(await screen.findByText('No sensors on this page')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Go to page 1' }))

    expect(await screen.findByText('Showing 1–10 of 30')).toBeInTheDocument()
  })
})

describe('SensorListPage states', () => {
  it('renders the loading skeleton while fetching', async () => {
    server.use(
      http.get('*/api/sensors', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json({ items: [], total: 0, page: 1, page_size: 20 })
      }),
    )
    renderList()

    expect(screen.getByRole('status', { name: 'Loading sensors' })).toBeInTheDocument()
    expect(await screen.findByText('No sensors found')).toBeInTheDocument()
  })

  it('renders the error banner and recovers via Retry', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/sensors', () => HttpResponse.json({ message: 'boom' }, { status: 500 })),
    )
    renderList()

    const banner = await screen.findByRole('alert')
    expect(within(banner).getByText('Failed to load sensors')).toBeInTheDocument()
    expect(within(banner).getByText('boom')).toBeInTheDocument()

    server.resetHandlers()
    await user.click(within(banner).getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Temperature Sensor 01')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the empty state with a working Reset button', async () => {
    const user = userEvent.setup()
    renderList('/sensors?q=does-not-exist')

    expect(await screen.findByText('No sensors found')).toBeInTheDocument()
    const emptyState = screen.getByText('No sensors found').closest('.empty-state')
    expect(emptyState).not.toBeNull()
    await user.click(within(emptyState as HTMLElement).getByRole('button', { name: 'Reset' }))

    expect(await screen.findByText('Temperature Sensor 01')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sensors')
    expect(screen.getByLabelText('Search')).toHaveValue('')
  })
})

describe('SensorListPage search debounce', () => {
  it('defers the fetch until the user stops typing', async () => {
    const listSensorsSpy = vi.spyOn(clientModule, 'listSensors')
    const user = userEvent.setup()
    renderList()

    await screen.findByText('Temperature Sensor 01')
    expect(listSensorsSpy).toHaveBeenCalledTimes(1)

    const input = screen.getByLabelText('Search')
    await user.type(input, 'temperature')

    expect(input).toHaveValue('temperature')
    expect(screen.getByTestId('location')).toHaveTextContent('/sensors')
    expect(listSensorsSpy).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/sensors?q=temperature')
    })
    expect(listSensorsSpy).toHaveBeenCalledTimes(2)
    expect(listSensorsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'temperature' }))

    expect(await screen.findByText('Showing 1–8 of 8')).toBeInTheDocument()
    listSensorsSpy.mockRestore()
  })
})
