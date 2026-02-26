import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { MapaOrgaosResponse } from '@licita/shared-types'

export function useMapaOrgaos(uf: string | null) {
  return useQuery<MapaOrgaosResponse>({
    queryKey: ['mapa', 'orgaos', uf],
    queryFn: async () => {
      const { data } = await apiClient.get<MapaOrgaosResponse>('/api/mapa/orgaos', {
        params: { uf },
      })
      return data
    },
    enabled: !!uf,
    staleTime: 3 * 60 * 1000,
    retry: 2,
  })
}
