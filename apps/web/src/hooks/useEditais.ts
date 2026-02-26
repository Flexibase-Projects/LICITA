import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { EditaisListParams, EditaisListResponse } from '@licita/shared-types'

export function useEditais(params: EditaisListParams = {}) {
  return useQuery({
    queryKey: ['editais', params],
    queryFn: async () => {
      const { data } = await apiClient.get<EditaisListResponse>('/api/editais', { params })
      return data
    },
  })
}

export function useEditalDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['edital', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/editais/${id}`)
      return data
    },
    enabled: !!id,
  })
}
