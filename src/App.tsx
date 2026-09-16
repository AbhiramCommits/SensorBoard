import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Skeleton } from './components/Skeleton'
import { SensorListPage } from './pages/SensorListPage'

const SensorDetailPage = lazy(() =>
  import('./pages/SensorDetailPage').then((module) => ({
    default: module.SensorDetailPage,
  })),
)

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/sensors" element={<SensorListPage />} />
        <Route
          path="/sensors/:id"
          element={
            <Suspense
              fallback={
                <div role="status" aria-label="Loading sensor">
                  <span className="sr-only">Loading sensor</span>
                  <Skeleton className="detail-skeleton" />
                </div>
              }
            >
              <SensorDetailPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/sensors" replace />} />
      </Route>
    </Routes>
  )
}

export default App
