import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { MapaHeatmapResponse } from '@licita/shared-types'

export function useMapaHeatmap() {
  return useQuery<MapaHeatmapResponse>({
    queryKey: ['mapa', 'heatmap'],
    queryFn: async () => {
      const { data } = await apiClient.get<MapaHeatmapResponse>('/api/mapa/heatmap')
      return data
    },
    staleTime: 60 * 60 * 1000,       // 1 hora
    refetchInterval: 60 * 60 * 1000, // atualização automática a cada 1 hora
    retry: 2,
  })
}
