import { useState, useCallback, useEffect, useRef } from 'react'
import RefreshStatsPanel from '../components/mapa/RefreshStatsPanel'
import type { RefreshStatsState } from '../components/mapa/RefreshStatsPanel'
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
import CircularProgress from '@mui/material/CircularProgress'
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
  const [refreshStats, setRefreshStats] = useState<RefreshStatsState | null>(null)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [valorMin, setValorMin] = useState<number | ''>('')
  const [valorMax, setValorMax] = useState<number | ''>('')
  const [preset50k, setPreset50k] = useState(false)

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

  // Detalhe do órgão — preview=true no dialog (só dados básicos, sem IA); preview=false no painel (com IA)
  const {
    data: orgaoDetailData,
    isLoading: orgaoDetailLoading,
    error: orgaoDetailError,
  } = useOrgaoDetail(
    (showDetailPanel || openEditalPreview) ? selectedCnpj : null,
    selectedUF,
    openEditalPreview && !showDetailPanel
  )

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

  // Clique em "Ver edital" na lista: abre apenas dialog com dados básicos da API + link para o site (sem IA)
  const handleVerEdital = useCallback((orgao: { cnpj: string }) => {
    setSelectedCnpj(orgao.cnpj)
    setShowDetailPanel(false)
    setOpenEditalPreview(true)
  }, [])

  const handleBack = useCallback(() => {
    setShowDetailPanel(false)
  }, [])

  const handleDismissRefreshStats = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setRefreshStats(null)
  }, [])

  useEffect(() => {
    return () => { if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current) }
  }, [])

  const handleRefresh = useCallback(async () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    setRefreshStats({ phase: 'refreshing', done: 0, total: UFS_REFRESH_ORDER.length, lastUF: '', totalFetched: 0, totalDiscarded: 0, totalSelected: 0 })

    let accFetched = 0
    let accDiscarded = 0
    let accSelected = 0

    for (let i = 0; i < UFS_REFRESH_ORDER.length; i++) {
      const uf = UFS_REFRESH_ORDER[i]
      try {
        const res = await apiClient.get('/api/mapa/refresh', { params: { uf } })
        const { totalFetched = 0, totalDiscarded = 0, totalSelected = 0 } = res.data ?? {}
        accFetched += totalFetched
        accDiscarded += totalDiscarded
        accSelected += totalSelected
      } catch {
        // segue mesmo se um estado falhar
      }
      setRefreshStats((prev) =>
        prev ? { ...prev, done: i + 1, lastUF: uf, totalFetched: accFetched, totalDiscarded: accDiscarded, totalSelected: accSelected } : null
      )
    }

    queryClient.invalidateQueries({ queryKey: ['mapa', 'heatmap'] })
    queryClient.invalidateQueries({ queryKey: ['mapa', 'orgaos'] })
    queryClient.invalidateQueries({ queryKey: ['mapa', 'orgao'] })
    await refetchHeatmap()

    setRefreshStats((prev) => prev ? { ...prev, phase: 'done' } : null)

    dismissTimerRef.current = setTimeout(() => {
      setRefreshStats(null)
      dismissTimerRef.current = null
    }, 10_000)
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
  const showEditalDialog = openEditalPreview

  const handleCloseEditalDialog = useCallback(() => {
    setOpenEditalPreview(false)
  }, [])

  return (
    <Box sx={{ mx: -3, mt: -3, mb: -3, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', bgcolor: '#0F172A', overflow: 'hidden' }}>
      {/* Barra de controles */}
      <MapaControls
        cacheAgeMinutes={heatmapData?.cache_age_minutes ?? 0}
        isLoading={heatmapLoading}
        isRefreshing={refreshStats?.phase === 'refreshing'}
        onRefresh={handleRefresh}
        valorMin={valorMin}
        valorMax={valorMax}
        preset50k={preset50k}
        onValorMinChange={(v) => { setPreset50k(false); setValorMin(v) }}
        onValorMaxChange={(v) => { setPreset50k(false); setValorMax(v) }}
        onPreset50k={() => { setPreset50k(true); setValorMin(50_000); setValorMax('') }}
        onClearValorFilter={() => { setPreset50k(false); setValorMin(''); setValorMax('') }}
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
                valorMinFilter={preset50k ? 50_000 : (valorMin === '' ? 0 : Number(valorMin))}
                valorMaxFilter={preset50k ? null : (valorMax === '' ? null : Number(valorMax))}
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

      {/* Dialog com dados básicos do edital (ao clicar em Ver edital) — apenas API, sem IA */}
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
        {orgaoDetailLoading ? (
          <>
            <DialogTitle sx={{ color: '#F1F5F9', fontSize: '0.9375rem', pb: 0 }}>
              Dados do edital
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1, minHeight: 120 }}>
              <CircularProgress size={32} sx={{ color: '#60A5FA' }} />
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Carregando…</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button size="small" onClick={handleCloseEditalDialog} sx={{ color: '#94A3B8' }}>
                Fechar
              </Button>
            </DialogActions>
          </>
        ) : orgaoDetailError ? (
          <>
            <DialogTitle sx={{ color: '#F1F5F9', fontSize: '0.9375rem', pb: 0 }}>
              Dados do edital
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#F87171' }}>Erro ao carregar os dados. Tente novamente.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button size="small" onClick={handleCloseEditalDialog} sx={{ color: '#94A3B8' }}>
                Fechar
              </Button>
            </DialogActions>
          </>
        ) : firstEdital ? (
          <>
            <DialogTitle sx={{ color: '#F1F5F9', fontSize: '0.9375rem', pb: 0 }}>
              Dados do edital (fonte: PNCP)
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {firstEdital.numeroControlePNCP && (
                  <InfoRow label="Nº controle PNCP" value={firstEdital.numeroControlePNCP} />
                )}
                {(firstEdital.numeroCompra || firstEdital.anoCompra != null) && (
                  <InfoRow
                    label="Número / Ano"
                    value={[firstEdital.numeroCompra, firstEdital.anoCompra].filter(Boolean).join(' / ') || '—'}
                  />
                )}
                {firstEdital.orgaoEntidade?.razaoSocial && (
                  <InfoRow label="Órgão" value={firstEdital.orgaoEntidade.razaoSocial} />
                )}
                {(firstEdital.unidadeOrgao?.nomeUnidade || firstEdital.unidadeOrgao?.municipioNome) && (
                  <InfoRow
                    label="Unidade"
                    value={
                      [firstEdital.unidadeOrgao?.nomeUnidade, firstEdital.unidadeOrgao?.municipioNome, firstEdital.unidadeOrgao?.ufSigla]
                        .filter(Boolean)
                        .join(' — ') || '—'
                    }
                  />
                )}
                <InfoRow label="Objeto" value={firstEdital.objetoCompra ?? '—'} />
                {firstEdital.informacaoComplementar && (
                  <InfoRow label="Informação complementar" value={firstEdital.informacaoComplementar} />
                )}
                <InfoRow label="Valor estimado" value={formatBRL(firstEdital.valorTotalEstimado)} />
                {firstEdital.valorTotalHomologado != null && firstEdital.valorTotalHomologado > 0 && (
                  <InfoRow label="Valor homologado" value={formatBRL(firstEdital.valorTotalHomologado)} />
                )}
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
                {firstEdital.dataEncerramentoProposta && (
                  <InfoRow
                    label="Encerramento propostas"
                    value={new Date(firstEdital.dataEncerramentoProposta).toLocaleDateString('pt-BR')}
                  />
                )}
                <InfoRow label="Modalidade" value={firstEdital.modalidadeNome ?? '—'} />
                <InfoRow label="Modo de disputa" value={firstEdital.modoDisputaNome ?? '—'} />
                <InfoRow label="Tipo instrumento" value={firstEdital.tipoInstrumentoConvocatorioNome ?? '—'} />
                <InfoRow label="Situação" value={firstEdital.situacaoCompraNome ?? '—'} />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', mt: 1.5, display: 'block' }}>
                Para análise com IA, importe o edital na lista de editais.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
              <Button
                size="small"
                component="a"
                href={
                  firstEdital.linkSistemaOrigem ??
                  `https://pncp.gov.br/app/editais/${(firstEdital.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '')}/${firstEdital.anoCompra}/${firstEdital.sequencialCompra}`
                }
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#60A5FA', textTransform: 'none', justifyContent: 'flex-start' }}
              >
                Clique aqui para acessar o edital no site
              </Button>
              <Button size="small" onClick={handleCloseEditalDialog} sx={{ color: '#94A3B8' }}>
                Fechar
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ color: '#F1F5F9', fontSize: '0.9375rem', pb: 0 }}>
              Dados do edital
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Nenhum edital encontrado para este órgão.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button size="small" onClick={handleCloseEditalDialog} sx={{ color: '#94A3B8' }}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <RefreshStatsPanel state={refreshStats} onDismiss={handleDismissRefreshStats} />
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
