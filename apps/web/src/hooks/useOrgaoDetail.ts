import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { MapaOrgaoDetailResponse } from '@licita/shared-types'

/** preview=true: só dados básicos (CNPJ + editais), sem IA — usado no dialog "Ver edital" */
export function useOrgaoDetail(cnpj: string | null, uf: string | null, preview = false) {
  return useQuery<MapaOrgaoDetailResponse>({
    queryKey: ['mapa', 'orgao', cnpj, uf, preview],
    queryFn: async () => {
      const digits = (cnpj ?? '').replace(/\D/g, '')
      const params: Record<string, string> = {}
      if (uf) params.uf = uf
      if (preview) params.preview = '1'
      const { data } = await apiClient.get<MapaOrgaoDetailResponse>(`/api/mapa/orgao/${digits}`, { params })
      return data
    },
    enabled: !!cnpj,
    staleTime: 10 * 60 * 1000,
    retry: preview ? 2 : 1,
  })
}
