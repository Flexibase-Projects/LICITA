import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { PNCPSearchResult } from '@licita/shared-types'

export interface PNCPSearchParams {
  dataInicial?: string
  dataFinal?: string
  modalidade?: number
  uf?: string
  pagina?: number
  tamanhoPagina?: number
  palavraChave?: string
}

export interface PNCPErrorWithDebug extends Error {
  debug?: Record<string, unknown>
}

export function usePNCPSearch(params: PNCPSearchParams, enabled = true) {
  return useQuery({
    queryKey: ['pncp-search', params],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<PNCPSearchResult | { error: string; debug?: Record<string, unknown> }>(
          '/api/pncp/search',
          { params }
        )
        if (data && 'error' in data && data.error) {
          const err = new Error(data.error) as PNCPErrorWithDebug
          err.debug = data.debug
          throw err
        }
        return data as PNCPSearchResult
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string; debug?: Record<string, unknown> } }; message?: string }
        if (axiosError?.response?.data) {
          const d = axiosError.response.data
          const e = new Error(d.error ?? axiosError.message ?? 'Erro ao consultar PNCP') as PNCPErrorWithDebug
          e.debug = d.debug
          throw e
        }
        throw err
      }
    },
    enabled,
  })
}

export interface PNCPSearchAllParams {
  dataInicial?: string
  dataFinal?: string
  modalidade?: number
  uf?: string
  limite?: number
}

export interface PNCPSearchAllResult {
  data: import('@licita/shared-types').PNCPContratacao[]
  totalRegistros: number
  totalCarregados: number
}

export function usePNCPSearchAll(params: PNCPSearchAllParams, enabled = true) {
  return useQuery({
    queryKey: ['pncp-search-all', params],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<PNCPSearchAllResult | { error: string; debug?: Record<string, unknown> }>(
          '/api/pncp/search-all',
          { params: { ...params, limite: params.limite ?? 1500 } }
        )
        if (data && 'error' in data && data.error) {
          const err = new Error(data.error) as PNCPErrorWithDebug
          err.debug = data.debug
          throw err
        }
        return data as PNCPSearchAllResult
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string; debug?: Record<string, unknown> } }; message?: string }
        if (axiosError?.response?.data) {
          const d = axiosError.response.data
          const e = new Error(d.error ?? axiosError.message ?? 'Erro ao carregar PNCP') as PNCPErrorWithDebug
          e.debug = d.debug
          throw e
        }
        throw err
      }
    },
    enabled,
  })
}

interface ImportParams {
  cnpjOrgao: string
  anoCompra: number
  sequencialCompra: number
}

export function usePNCPImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ImportParams) => {
      const { data } = await apiClient.post('/api/pncp/import', params)
      return data as { editalId: string; message: string; totalItens: number; hasPdf: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editais'] })
    },
  })
}
