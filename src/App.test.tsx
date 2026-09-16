import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { LocationProbe, renderWithProviders } from './test/utils'

function renderApp(route: string) {
  return renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route, withRoutes: false },
  )
}

describe('App', () => {
  it('renders the list page at /sensors with the app header', async () => {
    renderApp('/sensors')

    expect(screen.getByRole('banner')).toHaveTextContent('SensorBoard')
    expect(await screen.findByRole('heading', { name: 'Sensors' })).toBeInTheDocument()
    expect(await screen.findByText('Temperature Sensor 01')).toBeInTheDocument()
  })

  it('renders the detail page at /sensors/:id (lazy route)', async () => {
    renderApp('/sensors/sens-002')

    expect(await screen.findByRole('heading', { name: 'Humidity Sensor 02' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
  })

  it('redirects unknown routes to /sensors', async () => {
    renderApp('/not-a-route')

    expect(await screen.findByRole('heading', { name: 'Sensors' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sensors')
  })

  it('redirects the root to /sensors', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Sensors' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sensors')
  })
})
