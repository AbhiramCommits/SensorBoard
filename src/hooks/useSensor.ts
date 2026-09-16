import { useQuery } from '@tanstack/react-query'
import { getSensor } from '../api/client'

export function useSensor(id: string) {
  return useQuery({
    queryKey: ['sensor', id],
    queryFn: () => getSensor(id),
    enabled: id !== '',
  })
}
