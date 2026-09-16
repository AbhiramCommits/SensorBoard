import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listSensors, type ListSensorsParams } from '../api/client'

export function useSensors(params: ListSensorsParams) {
  return useQuery({
    queryKey: ['sensors', params],
    queryFn: () => listSensors(params),
    placeholderData: keepPreviousData,
  })
}
