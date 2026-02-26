import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import VerifiedIcon from '@mui/icons-material/Verified'
import InventoryIcon from '@mui/icons-material/Inventory'
import RefreshIcon from '@mui/icons-material/Refresh'
import ChecklistIcon from '@mui/icons-material/Checklist'
import RateReviewIcon from '@mui/icons-material/RateReview'
import { useEditalDetail } from '../hooks/useEditais'
import { apiClient } from '../services/apiClient'
import { useQueryClient } from '@tanstack/react-query'
import {
  formatBRL,
  formatDateTime,
  formatModalidade,
  formatViabilidade,
} from '../utils/formatters'
import RequisitoCards from '../components/dashboard/RequisitoCards'
import FeedbackModal from '../components/dashboard/FeedbackModal'
import type { ItemEdital, Certificacao, ViabilidadeVeredicto, EditalCompleto, AnaliseTipo } from '@licita/shared-types'

const VIABILIDADE_COLOR: Record<ViabilidadeVeredicto, 'success' | 'warning' | 'error'> = {
  viavel: 'success',
  parcialmente_viavel: 'warning',
  inviavel: 'error',
}

function useHighlightCategories() {
  const [cats, setCats] = useState<Set<string>>(new Set(['mobiliario', 'assento']))
  useEffect(() => {
    apiClient.get('/api/training/categories').then(({ data }) => {
      const active = (data as Array<{ nome: string; ativa: boolean }>)
        .filter((c) => c.ativa)
        .map((c) => c.nome)
      if (active.length > 0) setCats(new Set(active))
    }).catch(() => {})
  }, [])
  return cats
}

const ITEM_COLUMNS: GridColDef<ItemEdital>[] = [
  { field: 'numero_lote', headerName: 'Lote', width: 70, valueGetter: (_v, row) => row.numero_lote ?? '—' },
  { field: 'numero_item', headerName: 'Item', width: 70 },
  { field: 'descricao', headerName: 'Descrição', flex: 1, minWidth: 200 },
  { field: 'categoria', headerName: 'Categoria', width: 120, renderCell: ({ value }) => value ? <Chip label={value} size="small" variant="outlined" /> : '—' },
  { field: 'unidade', headerName: 'Un.', width: 70, valueGetter: (_v, row) => row.unidade ?? '—' },
  {
    field: 'quantidade',
    headerName: 'Qtd.',
    width: 90,
    type: 'number',
    valueFormatter: (value) => value != null ? Number(value).toLocaleString('pt-BR') : '—',
  },
  {
    field: 'valor_unitario_estimado',
    headerName: 'Vlr. Unit.',
    width: 130,
    valueFormatter: (value) => formatBRL(value as number | null),
  },
  {
    field: 'valor_total_estimado',
    headerName: 'Vlr. Total',
    width: 140,
    valueFormatter: (value) => formatBRL(value as number | null),
  },
  {
    field: 'pode_produzir',
    headerName: 'Viabilidade',
    width: 120,
    renderCell: ({ value, row }) => {
      if (value === null || value === undefined) return <Chip label="—" size="small" />
      return (
        <Tooltip title={row.viabilidade_justificativa ?? ''}>
          <Chip
            label={value ? '✓ Produz' : '✗ Não Produz'}
            color={value ? 'success' : 'error'}
            size="small"
          />
        </Tooltip>
      )
    },
  },
]

export default function EditalDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: edital, isLoading, error } = useEditalDetail(id)

  const highlightCategories = useHighlightCategories()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTipo, setFeedbackTipo] = useState<AnaliseTipo>('resumo_executivo')
  const [feedbackLabel, setFeedbackLabel] = useState('')

  const openFeedback = (tipo: AnaliseTipo, label: string) => {
    setFeedbackTipo(tipo)
    setFeedbackLabel(label)
    setFeedbackOpen(true)
  }

  const handleReanalyzeViabilidade = async () => {
    await apiClient.post(`/api/editais/${id}/viabilidade`)
    queryClient.invalidateQueries({ queryKey: ['edital', id] })
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton height={48} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid size={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    )
  }

  if (error || !edital) {
    return <Alert severity="error">Edital não encontrado ou erro ao carregar.</Alert>
  }

  const ed = edital as EditalCompleto
  const viabilidade = ed.viabilidade_veredicto as ViabilidadeVeredicto | null
  const orgaoDisplay = ed.orgao?.nome_curto ?? ed.orgao?.nome ?? 'Órgão não identificado'

  const totalItens = ed.itens?.length ?? 0

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/editais')} size="medium" sx={{ mt: 0.25 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {ed.numero_edital && (
              <Chip label={`Edital ${ed.numero_edital}`} size="small" variant="outlined" color="primary" />
            )}
            <Chip label={formatModalidade(ed.modalidade)} size="small" variant="outlined" />
            <Chip
              label={ed.origem === 'pncp' ? 'PNCP' : 'Upload'}
              size="small"
              color={ed.origem === 'pncp' ? 'info' : 'default'}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.35} sx={{ mb: 0.5 }}>
            {ed.objeto}
          </Typography>
          {ed.orgao && (
            <Tooltip title={ed.orgao.nome} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'help' }}>
                <AccountBalanceIcon fontSize="small" color="action" />
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                  {orgaoDisplay} {ed.orgao.uf ? `— ${ed.orgao.uf}` : ''}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 2.5, px: 2.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AttachMoneyIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 0.8 }}>Valor Estimado</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>{formatBRL(ed.valor_estimado)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 2.5, px: 2.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 0.8 }}>Abertura das Propostas</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>{formatDateTime(ed.data_abertura_propostas)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 2.5, px: 2.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InventoryIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 0.8 }}>Total de Itens</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>{totalItens}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 2,
              borderWidth: viabilidade ? 2 : 1,
              borderColor: viabilidade ? `${VIABILIDADE_COLOR[viabilidade]}.main` : 'divider',
            }}
          >
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', py: 2.5, px: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: viabilidade ? `${VIABILIDADE_COLOR[viabilidade]}.main` : 'action.hover', color: viabilidade ? `${VIABILIDADE_COLOR[viabilidade]}.contrastText` : 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VerifiedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: 0.8 }}>Viabilidade</Typography>
                  {viabilidade ? (
                    <>
                      <Typography variant="h6" fontWeight={700} color={`${VIABILIDADE_COLOR[viabilidade]}.main`} sx={{ mt: 0.25 }}>
                        {formatViabilidade(viabilidade)}
                      </Typography>
                      {ed.viabilidade_score != null && (
                        <LinearProgress variant="determinate" value={ed.viabilidade_score} color={VIABILIDADE_COLOR[viabilidade]} sx={{ mt: 0.75, height: 6, borderRadius: 1 }} />
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.25 }}>Não calculada</Typography>
                  )}
                </Box>
              </Box>
              <Tooltip title="Re-analisar viabilidade">
                <IconButton size="small" onClick={handleReanalyzeViabilidade}><RefreshIcon fontSize="small" /></IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumo Executivo */}
      {ed.resumo_executivo && (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
          <CardHeader
            title="Resumo Executivo"
            titleTypographyProps={{ fontWeight: 600, variant: 'h6' }}
            action={
              <IconButton size="small" onClick={() => openFeedback('resumo_executivo', 'Resumo Executivo')} aria-label="Avaliar análise">
                <RateReviewIcon fontSize="small" />
              </IconButton>
            }
          />
          <Divider />
          <CardContent sx={{ pt: 2, pb: 3, px: 3 }}>
            <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {ed.resumo_executivo}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Requisitos */}
      {ed.requisitos && ed.requisitos.length > 0 && (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
          <CardHeader
            title={`Requisitos de Habilitação (${ed.requisitos.length})`}
            titleTypographyProps={{ fontWeight: 600, variant: 'h6' }}
            avatar={<ChecklistIcon color="primary" />}
            action={
              <IconButton size="small" onClick={() => openFeedback('requisitos_tecnicos', 'Requisitos')} aria-label="Avaliar análise">
                <RateReviewIcon fontSize="small" />
              </IconButton>
            }
          />
          <Divider />
          <CardContent sx={{ p: 2 }}>
            <RequisitoCards requisitos={ed.requisitos} />
          </CardContent>
        </Card>
      )}

      {/* Tabela de Itens */}
      <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
        <CardHeader
          title={`Itens do Edital (${totalItens})`}
          titleTypographyProps={{ fontWeight: 600, variant: 'h6' }}
          subheader={totalItens === 0 ? 'Nenhum item extraído. Execute novamente a análise do edital para varredura completa do PDF.' : undefined}
          action={
            <IconButton size="small" onClick={() => openFeedback('itens_completos', 'Itens do Edital')} aria-label="Avaliar análise de itens">
              <RateReviewIcon fontSize="small" />
            </IconButton>
          }
        />
        <Divider />
        {totalItens > 0 ? (
          <Box sx={{ height: 520, px: 1, pb: 1 }}>
            <DataGrid
              rows={ed.itens ?? []}
              columns={ITEM_COLUMNS}
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              getRowHeight={() => 'auto'}
              getRowClassName={(params) => {
                const cat = (params.row as ItemEdital).categoria
                if (cat && highlightCategories.has(cat)) return 'item-highlighted'
                return 'item-dimmed'
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { py: 1 },
                '& .item-highlighted': {
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  fontWeight: 500,
                },
                '& .item-dimmed': {
                  opacity: 0.7,
                },
                '& .item-dimmed:hover': {
                  opacity: 1,
                },
              }}
            />
          </Box>
        ) : (
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
              Nenhum item foi extraído nesta análise.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              A nova varredura processa todo o PDF em blocos. Reexecute a análise na lista de editais para obter os itens.
            </Typography>
          </CardContent>
        )}
      </Card>

      {/* Certificações */}
      {ed.certificacoes && ed.certificacoes.length > 0 && (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
          <CardHeader
            title={`Certificações Exigidas (${ed.certificacoes.length})`}
            titleTypographyProps={{ fontWeight: 600, variant: 'h6' }}
            avatar={<VerifiedIcon color="primary" />}
          />
          <Divider />
          <CardContent sx={{ pt: 2, pb: 3, px: 3 }}>
            <Grid container spacing={2}>
              {ed.certificacoes.map((cert: Certificacao) => (
                <Grid key={cert.id} size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: cert.obrigatoria ? 'error.light' : 'divider',
                      borderRadius: 2,
                      bgcolor: cert.obrigatoria ? 'rgba(220,38,38,0.04)' : 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{cert.nome}</Typography>
                      <Chip
                        label={cert.obrigatoria ? 'Obrigatória' : 'Recomendada'}
                        color={cert.obrigatoria ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                    {cert.norma && (
                      <Typography variant="caption" color="text.secondary">{cert.norma}</Typography>
                    )}
                    {cert.descricao && (
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{cert.descricao}</Typography>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Info adicional */}
      <Grid container spacing={2}>
        {ed.endereco_entrega && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Endereço de Entrega</Typography>
                <Typography variant="body2" color="text.secondary">{ed.endereco_entrega}</Typography>
                {ed.municipio_entrega && (
                  <Typography variant="body2" color="text.secondary">
                    {ed.municipio_entrega} {ed.uf_entrega ? `— ${ed.uf_entrega}` : ''}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
        {ed.prazo_execucao_dias && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Prazo de Execução</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {ed.prazo_execucao_dias} dias
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Analisar se pending */}
      {(ed.status === 'pending' || ed.status === 'error') && ed.pdf_storage_path && (
        <Alert
          severity="info"
          sx={{ mt: 2 }}
          action={
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                await apiClient.post('/api/analyze', { editalId: id })
                queryClient.invalidateQueries({ queryKey: ['edital', id] })
              }}
            >
              Analisar com OLLAMA
            </Button>
          }
        >
          Este edital ainda não foi analisado pelo OLLAMA. Clique para iniciar.
        </Alert>
      )}

      {/* Feedback Modal */}
      {id && (
        <FeedbackModal
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          editalId={id}
          tipoAnalise={feedbackTipo}
          labelAnalise={feedbackLabel}
        />
      )}
    </Box>
  )
}
