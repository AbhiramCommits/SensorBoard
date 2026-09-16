import { useQuery } from '@tanstack/react-query'
import { listReadings } from '../api/client'

const MAX_READINGS = 1000

export function useReadings(id: string, start: string | undefined, end: string | undefined) {
  return useQuery({
    queryKey: ['readings', id, start, end],
    queryFn: () => listReadings(id, { start, end, limit: MAX_READINGS }),
    enabled: id !== '',
  })
}
