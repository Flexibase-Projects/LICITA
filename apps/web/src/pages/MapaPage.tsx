import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { useMapaHeatmap } from '../hooks/useMapaHeatmap'
import { useMapaOrgaos } from '../hooks/useMapaOrgaos'
import { useOrgaoDetail } from '../hooks/useOrgaoDetail'
import BrazilMap from '../components/mapa/BrazilMap'
import MapaControls from '../components/mapa/MapaControls'
import EstadoSidebar from '../components/mapa/EstadoSidebar'
import OrgaoDetailPanel from '../components/mapa/OrgaoDetailPanel'
import { apiClient } from '../services/apiClient'
import { formatBRL } from '../utils/formatters'
import type { PNCPContratacao } from '@licita/shared-types'

const SIDEBAR_WIDTH = 380

/** Ordem dos 27 estados para refresh progressivo */
const UFS_REFRESH_ORDER = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

export default function MapaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedUF, setSelectedUF] = useState<string | null>(null)
  const [selectedCnpj, setSelectedCnpj] = useState<string | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [openEditalPreview, setOpenEditalPreview] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState<{ done: number; total: number; lastUF: string } | null>(null)

  // Dados do heatmap
  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    refetch: refetchHeatmap,
  } = useMapaHeatmap()

  // Órgãos do estado selecionado
  const {
    data: orgaosData,
    isLoading: orgaosLoading,
    error: orgaosError,
    refetch: refetchOrgaos,
  } = useMapaOrgaos(selectedUF)

  // Detalhe do órgão — só busca quando o painel de detalhe está aberto (evita IA ao só clicar no marcador)
  const {
    data: orgaoDetailData,
    isLoading: orgaoDetailLoading,
    error: orgaoDetailError,
  } = useOrgaoDetail(showDetailPanel ? selectedCnpj : null, selectedUF)

  const handleSelectUF = useCallback((uf: string | null) => {
    setSelectedUF(uf)
    setSelectedCnpj(null) // limpa orgão ao trocar estado
  }, [])

  // Clique no marcador do mapa: só destaca o órgão na lista (sem abrir painel / sem IA)
  const handleSelectOrgao = useCallback((cnpj: string) => {
    setSelectedCnpj(cnpj)
    setShowDetailPanel(false)
    setOpenEditalPreview(false)
  }, [])

  // Clique em "Ver edital" na lista: abre painel de detalhe (carrega editais e IA) e dialog do edital
  const handleVerEdital = useCallback((orgao: { cnpj: string }) => {
    setSelectedCnpj(orgao.cnpj)
    setShowDetailPanel(true)
    setOpenEditalPreview(true)
  }, [])

  const handleBack = useCallback(() => {
    setShowDetailPanel(false)
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshProgress({ done: 0, total: UFS_REFRESH_ORDER.length, lastUF: '' })
    for (let i = 0; i < UFS_REFRESH_ORDER.length; i++) {
      const uf = UFS_REFRESH_ORDER[i]
      try {
        await apiClient.get('/api/mapa/refresh', { params: { uf } })
      } catch {
        // segue mesmo se um estado falhar
      }
      setRefreshProgress((prev) => (prev ? { ...prev, done: i + 1, lastUF: uf } : null))
    }
    queryClient.invalidateQueries({ queryKey: ['mapa', 'heatmap'] })
    queryClient.invalidateQueries({ queryKey: ['mapa', 'orgaos'] })
    queryClient.invalidateQueries({ queryKey: ['mapa', 'orgao'] })
    await refetchHeatmap()
    setRefreshProgress(null)
  }, [queryClient, refetchHeatmap])

  const handleImportEdital = useCallback(async (codigoPncp: string) => {
    try {
      // Usa o endpoint já existente de importação
      const res = await apiClient.post('/api/pncp/import', { codigoPncp })
      if (res.data?.editalId) {
        navigate(`/editais/${res.data.editalId}`)
      }
    } catch (err) {
      console.error('Erro ao importar edital:', err)
    }
  }, [navigate])

  const estados = heatmapData?.estados ?? []
  const orgaosRaw = orgaosData?.orgaos ?? []
  const refetchOrgaosOncePerUF = useRef<Set<string>>(new Set())

  // Se a API devolver todos no mesmo lugar (cache antigo), forçar refetch uma vez por UF
  useEffect(() => {
    if (!selectedUF || orgaosRaw.length < 2) return
    const withCoords = orgaosRaw.filter((o) => o.lat != null && o.lng != null)
    if (withCoords.length < 2) return
    const uniquePos = new Set(withCoords.map((o) => `${o.lat},${o.lng}`)).size
    const uniqueMun = new Set(orgaosRaw.map((o) => (o.municipio ?? '').trim().toLowerCase()).filter(Boolean)).size
    if (uniquePos === 1 && uniqueMun > 1 && !refetchOrgaosOncePerUF.current.has(selectedUF)) {
      refetchOrgaosOncePerUF.current.add(selectedUF)
      queryClient.invalidateQueries({ queryKey: ['mapa', 'orgaos', selectedUF] })
      refetchOrgaos()
    }
  }, [selectedUF, orgaosRaw, queryClient, refetchOrgaos])

  const orgaos = orgaosRaw
  const showSidebar = !!selectedUF
  const orgaoDetail = orgaoDetailData?.orgao
  const firstEdital: PNCPContratacao | undefined = orgaoDetail?.editais?.[0]
  const showEditalDialog = openEditalPreview && !!firstEdital

  const handleCloseEditalDialog = useCallback(() => {
    setOpenEditalPreview(false)
  }, [])

  return (
    <Box sx={{ mx: -3, mt: -3, mb: -3, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', bgcolor: '#0F172A', overflow: 'hidden' }}>
      {/* Barra de controles */}
      <MapaControls
        cacheAgeMinutes={heatmapData?.cache_age_minutes ?? 0}
        isLoading={heatmapLoading}
        isRefreshing={refreshProgress !== null}
        onRefresh={handleRefresh}
      />

      {/* Área principal: mapa + sidebar */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Mapa */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <BrazilMap
            selectedUF={selectedUF}
            selectedCnpj={selectedCnpj}
            heatmapData={estados}
            orgaos={orgaos}
            onSelectUF={handleSelectUF}
            onSelectOrgao={handleSelectOrgao}
          />

          {/* Instrução inicial quando nenhum estado selecionado */}
          {!selectedUF && !heatmapLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                bgcolor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                Clique em um estado para ver os órgãos com editais de mobiliário
              </Typography>
            </Box>
          )}
        </Box>

        {/* Painel lateral */}
        {showSidebar && (
          <Paper
            elevation={0}
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              bgcolor: '#0F172A',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Painel de detalhe (IA) só quando abriu por "Ver edital"; senão lista com destaque do marcador */}
            {showDetailPanel && selectedCnpj ? (
              <OrgaoDetailPanel
                orgao={orgaoDetailData?.orgao}
                isLoading={orgaoDetailLoading}
                error={orgaoDetailError instanceof Error ? orgaoDetailError : null}
                onBack={handleBack}
                onImportEdital={handleImportEdital}
              />
            ) : (
              <EstadoSidebar
                uf={selectedUF!}
                orgaos={orgaos}
                isLoading={orgaosLoading}
                error={orgaosError instanceof Error ? orgaosError : null}
                selectedCnpj={selectedCnpj}
                onVerEdital={handleVerEdital}
              />
            )}
          </Paper>
        )}
      </Box>

      {/* Dialog com dados básicos do edital (ao clicar em Ver edital na lista) */}
      <Dialog
        open={showEditalDialog}
        onClose={handleCloseEditalDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0F172A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        {firstEdital && (
          <>
            <DialogTitle sx={{ color: '#F1F5F9', fontSize: '0.9375rem', pb: 0 }}>
              Dados do edital
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <InfoRow label="Objeto" value={firstEdital.objetoCompra} />
                <InfoRow label="Valor estimado" value={formatBRL(firstEdital.valorTotalEstimado)} />
                <InfoRow
                  label="Data publicação"
                  value={
                    firstEdital.dataPublicacaoPncp
                      ? new Date(firstEdital.dataPublicacaoPncp).toLocaleDateString('pt-BR')
                      : '—'
                  }
                />
                {firstEdital.dataAberturaProposta && (
                  <InfoRow
                    label="Abertura propostas"
                    value={new Date(firstEdital.dataAberturaProposta).toLocaleDateString('pt-BR')}
                  />
                )}
                <InfoRow label="Modalidade" value={firstEdital.modalidadeNome ?? '—'} />
                <InfoRow label="Situação" value={firstEdital.situacaoCompraNome ?? '—'} />
                {orgaoDetail && (
                  <InfoRow label="Órgão" value={`${orgaoDetail.nome} — ${orgaoDetail.municipio}/${orgaoDetail.uf}`} />
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button
                size="small"
                href={
                  firstEdital.linkSistemaOrigem ??
                  `https://pncp.gov.br/app/editais/${(firstEdital.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '')}/${firstEdital.anoCompra}/${firstEdital.sequencialCompra}`
                }
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#60A5FA', textTransform: 'none' }}
              >
                Abrir no PNCP
              </Button>
              <Button size="small" onClick={handleCloseEditalDialog} sx={{ color: '#94A3B8' }}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Notificação flutuante: progresso do refresh por estado */}
      {refreshProgress && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(96, 165, 250, 0.35)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
            {refreshProgress.lastUF ? `${refreshProgress.lastUF} concluído` : 'Atualizando…'}
          </Typography>
          <Typography sx={{ color: '#60A5FA', fontSize: '0.75rem', fontWeight: 700 }}>
            {refreshProgress.done}/{refreshProgress.total}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <Typography variant="caption" sx={{ color: '#64748B', minWidth: 100, flexShrink: 0, fontSize: '0.75rem' }}>
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ color: '#E2E8F0', fontSize: '0.8125rem', wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}
