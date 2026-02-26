import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { MapaOrgaoDetailResponse } from '@licita/shared-types'

export function useOrgaoDetail(cnpj: string | null, uf: string | null) {
  return useQuery<MapaOrgaoDetailResponse>({
    queryKey: ['mapa', 'orgao', cnpj, uf],
    queryFn: async () => {
      const digits = (cnpj ?? '').replace(/\D/g, '')
      const params = uf ? { uf } : {}
      const { data } = await apiClient.get<MapaOrgaoDetailResponse>(`/api/mapa/orgao/${digits}`, { params })
      return data
    },
    enabled: !!cnpj,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
