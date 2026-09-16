import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

interface RenderOptions {
  route?: string
  withRoutes?: boolean
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  })
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const queryClient = createQueryClient()
  const children =
    options.withRoutes === false ? (
      ui
    ) : (
      <Routes>
        <Route path="/sensors" element={ui} />
        <Route path="/sensors/:id" element={ui} />
        <Route path="*" element={ui} />
      </Routes>
    )
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options.route ?? '/sensors']}>{children}</MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}

export function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  )
}
