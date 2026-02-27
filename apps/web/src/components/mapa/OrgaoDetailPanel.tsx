import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BusinessIcon from '@mui/icons-material/Business'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import type { OrgaoDetalhe } from '@licita/shared-types'
import { formatBRL } from '../../utils/formatters'

interface OrgaoDetailPanelProps {
  orgao: OrgaoDetalhe | undefined
  isLoading: boolean
  error: Error | null
  onBack: () => void
  onImportEdital: (codigoPncp: string) => void
  /** Filtro de valor definido na barra do mapa (valor mínimo em R$) */
  valorMinFilter?: number
  /** Filtro de valor definido na barra do mapa (valor máximo em R$, null = sem máximo) */
  valorMaxFilter?: number | null
}

const POTENCIAL_CONFIG = {
  alto: { label: 'Alto Potencial', color: '#22C55E', bgcolor: 'rgba(34, 197, 94, 0.15)' },
  medio: { label: 'Potencial Médio', color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.15)' },
  baixo: { label: 'Baixo Potencial', color: '#64748B', bgcolor: 'rgba(100, 116, 139, 0.1)' },
}

export default function OrgaoDetailPanel({
  orgao,
  isLoading,
  error,
  onBack,
  onImportEdital,
  valorMinFilter = 0,
  valorMaxFilter = null,
}: OrgaoDetailPanelProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 2 }}>
        <CircularProgress size={40} sx={{ color: '#60A5FA' }} />
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Consultando PNCP e analisando com IA...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#94A3B8', mb: 1 }}>
          Voltar
        </Button>
        <Alert severity="error">Erro ao carregar dados do órgão.</Alert>
      </Box>
    )
  }

  if (!orgao) return null

  const potencial = POTENCIAL_CONFIG[orgao.ai_potencial] ?? POTENCIAL_CONFIG.medio

  const filteredEditais = useMemo(() => {
    return orgao.editais.filter((e) => {
      const v = e.valorTotalEstimado ?? 0
      return v >= valorMinFilter && (valorMaxFilter == null || v <= valorMaxFilter)
    })
  }, [orgao.editais, valorMinFilter, valorMaxFilter])

  const hasValorFilter = valorMinFilter > 0 || valorMaxFilter != null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header — nome do órgão bem posicionado */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Tooltip title="Voltar para lista de órgãos">
            <IconButton size="small" onClick={onBack} sx={{ color: '#94A3B8' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <BusinessIcon sx={{ color: '#60A5FA', fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F1F5F9', flex: 1, fontSize: '0.875rem' }} noWrap>
            {orgao.nome}
          </Typography>
        </Box>

        <Stack direction="row" gap={0.75} flexWrap="wrap">
          <Chip
            label={potencial.label}
            icon={<TrendingUpIcon style={{ color: potencial.color, fontSize: 12 }} />}
            size="small"
            sx={{ bgcolor: potencial.bgcolor, color: potencial.color, fontWeight: 600, fontSize: '0.65rem' }}
          />
          <Chip
            label={orgao.uf}
            size="small"
            sx={{ bgcolor: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', fontSize: '0.65rem' }}
          />
          <Chip
            label={`${orgao.editais.length} edital(is)`}
            size="small"
            sx={{ bgcolor: 'rgba(27, 79, 216, 0.15)', color: '#60A5FA', fontSize: '0.65rem' }}
          />
        </Stack>
      </Box>

      {/* Conteúdo scrollável */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>

        {/* Dados do CNPJ */}
        {orgao.dados_cnpj && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
              Dados Cadastrais
            </Typography>
            <Box sx={{ mt: 0.5, display: 'grid', gap: 0.25 }}>
              <InfoRow label="CNPJ" value={orgao.cnpj} />
              <InfoRow label="Município" value={`${orgao.municipio} / ${orgao.uf}`} />
              {orgao.dados_cnpj.natureza_juridica?.descricao && (
                <InfoRow label="Natureza" value={orgao.dados_cnpj.natureza_juridica.descricao} />
              )}
              {orgao.dados_cnpj.descricao_situacao_cadastral && (
                <InfoRow label="Situação" value={orgao.dados_cnpj.descricao_situacao_cadastral} />
              )}
              {orgao.dados_cnpj.telefone && (
                <InfoRow label="Telefone" value={orgao.dados_cnpj.telefone} />
              )}
              {orgao.dados_cnpj.email && (
                <InfoRow label="E-mail" value={orgao.dados_cnpj.email} />
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />

        {/* Análise IA */}
        <Accordion
          defaultExpanded
          sx={{
            bgcolor: 'rgba(14, 164, 114, 0.05)',
            border: '1px solid rgba(14, 164, 114, 0.2)',
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            mb: 1.5,
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0EA472', fontSize: 18 }} />} sx={{ minHeight: 40 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AutoAwesomeIcon sx={{ color: '#0EA472', fontSize: 14 }} />
              <Typography variant="body2" fontWeight={700} sx={{ color: '#0EA472', fontSize: '0.8125rem' }}>
                Análise IA — Prospecção
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 1, lineHeight: 1.5, fontSize: '0.8125rem' }}>
              {orgao.ai_resumo}
            </Typography>
            {orgao.ai_recomendacao && (
              <Box
                sx={{
                  bgcolor: 'rgba(27, 79, 216, 0.1)',
                  border: '1px solid rgba(27, 79, 216, 0.2)',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', mb: 0.25, fontSize: '0.65rem' }}>
                  Recomendação:
                </Typography>
                <Typography variant="body2" sx={{ color: '#BAC6F7', lineHeight: 1.4, fontSize: '0.8125rem' }}>
                  {orgao.ai_recomendacao}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Editais — tabela (filtro de valor definido na barra do mapa) */}
        <Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75, fontSize: '0.65rem' }}>
            Editais — {filteredEditais.length}
            {hasValorFilter && ` de ${orgao.editais.length} (filtro valor na barra)`}
          </Typography>

          {filteredEditais.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 1.5, fontSize: '0.8125rem' }}>
              {orgao.editais.length === 0
                ? 'Nenhum edital encontrado neste período.'
                : 'Nenhum edital no intervalo de valor. Ajuste o filtro na barra acima.'}
            </Typography>
          ) : (
            <Table size="small" sx={{ '& .MuiTableCell-root': { fontSize: '0.75rem', py: 0.5 }, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)' }}>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Objeto</TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Valor</TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Data</TableCell>
                  <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 600 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEditais.slice(0, 15).map((edital) => {
                  const cnpjDigits = (edital.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '')
                  const pncpUrl = edital.linkSistemaOrigem
                    ?? `https://pncp.gov.br/app/editais/${cnpjDigits}/${edital.anoCompra}/${edital.sequencialCompra}`
                  return (
                    <TableRow key={edital.numeroControlePNCP} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                      <TableCell sx={{ color: '#CBD5E1', maxWidth: 180 }} title={edital.objetoCompra}>
                        <Typography noWrap sx={{ fontSize: '0.75rem' }}>{edital.objetoCompra}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8' }}>
                        {edital.valorTotalEstimado != null ? formatBRL(edital.valorTotalEstimado) : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8' }}>
                        {edital.dataPublicacaoPncp ? new Date(edital.dataPublicacaoPncp).toLocaleDateString('pt-BR') : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Abrir no PNCP">
                            <IconButton size="small" href={pncpUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#64748B', p: 0.25 }}>
                              <OpenInNewIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onImportEdital(edital.numeroControlePNCP)}
                            sx={{ fontSize: '0.6rem', py: 0.2, px: 0.75, minWidth: 0 }}
                          >
                            Importar
                          </Button>
                          <Button size="small" variant="outlined" sx={{ fontSize: '0.6rem', py: 0.2, px: 0.75, minWidth: 0 }}>
                            VER EDITAL
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
      <Typography variant="caption" sx={{ color: '#64748B', minWidth: 64, flexShrink: 0, fontSize: '0.7rem' }}>
        {label}:
      </Typography>
      <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.7rem' }}>
        {value}
      </Typography>
    </Box>
  )
}
