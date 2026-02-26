import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Pagination from '@mui/material/Pagination'
import Tooltip from '@mui/material/Tooltip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { usePNCPSearchAll, usePNCPImport, type PNCPErrorWithDebug } from '../hooks/usePNCPSearch'
import { formatBRL, formatDateTime } from '../utils/formatters'
import { getPncpCompraUrl } from '../utils/pncp'
import type { PNCPContratacao } from '@licita/shared-types'

const UF_OPTIONS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function PNCPBrowserPage() {
  const navigate = useNavigate()
  const [palavraChave, setPalavraChave] = useState('')
  const [uf, setUf] = useState('')
  const [modalidade, setModalidade] = useState<number | ''>('')
  const [hasSearched, setHasSearched] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [debugOpen, setDebugOpen] = useState(false)

  const hoje = new Date()
  const mesPassado = new Date(hoje)
  mesPassado.setMonth(mesPassado.getMonth() - 1)
  const dataFinal = hoje.toISOString().slice(0, 10).replace(/-/g, '')
  const dataInicial = mesPassado.toISOString().slice(0, 10).replace(/-/g, '')

  const { data, isLoading, error, refetch, isFetching } = usePNCPSearchAll(
    {
      dataInicial,
      dataFinal,
      uf: uf || undefined,
      modalidade: modalidade || undefined,
      limite: 1500,
    },
    hasSearched
  )

  const importMutation = usePNCPImport()
  const errWithDebug = error as PNCPErrorWithDebug | undefined
  const hasDebug = !!(errWithDebug?.debug && Object.keys(errWithDebug.debug).length > 0)

  const filteredData = useMemo(() => {
    if (!data?.data) return []
    const kw = palavraChave.trim().toLowerCase()
    if (!kw) return data.data
    return data.data.filter((c) => (c.objetoCompra ?? '').toLowerCase().includes(kw))
  }, [data?.data, palavraChave])

  const handleSearch = () => {
    setHasSearched(true)
    refetch()
  }

  const pncpUrl = (c: PNCPContratacao) => getPncpCompraUrl(c)

  const handleImport = async (contratacao: PNCPContratacao) => {
    const cnpjDigits = (contratacao.orgaoEntidade?.cnpj ?? '').replace(/\D/g, '')
    if (cnpjDigits.length !== 14) {
      window.open(pncpUrl(contratacao), '_blank')
      return
    }
    const key = contratacao.numeroControlePNCP
    const url = pncpUrl(contratacao)

    setImportingId(key)
    setImportSuccess(null)

    try {
      const result = await importMutation.mutateAsync({
        cnpjOrgao: cnpjDigits,
        anoCompra: contratacao.anoCompra,
        sequencialCompra: contratacao.sequencialCompra,
      })

      if (result.hasPdf) {
        setImportSuccess(result.editalId)
        setTimeout(() => navigate(`/editais/${result.editalId}`), 1200)
      } else {
        setImportSuccess('no-pdf')
        window.open(url, '_blank')
      }
    } catch {
      setImportSuccess('error')
      window.open(url, '_blank')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Portal Nacional de Contratações (PNCP)
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Busque e importe editais diretamente da base de dados federal.
      </Typography>

      {/* Filtros */}
      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Filtrar por palavra-chave (após carregar)"
                fullWidth
                size="small"
                value={palavraChave}
                onChange={(e) => setPalavraChave(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ex: mobiliário, cadeira, mesa — filtra a tabela"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>UF</InputLabel>
                <Select value={uf} onChange={(e) => setUf(e.target.value)} label="UF">
                  <MenuItem value="">Todas</MenuItem>
                  {UF_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Modalidade</InputLabel>
                <Select value={modalidade} onChange={(e) => setModalidade(e.target.value as number | '')} label="Modalidade">
                  <MenuItem value="">Todas (Pregão Eletrônico)</MenuItem>
                  <MenuItem value={8}>Pregão Eletrônico</MenuItem>
                  <MenuItem value={6}>Dispensa</MenuItem>
                  <MenuItem value={2}>Concorrência</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button
                variant="contained"
                fullWidth
                size="medium"
                startIcon={isFetching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                onClick={handleSearch}
                disabled={isFetching}
              >
                {isFetching ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading visual (barra + status) */}
      {isFetching && (
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
          <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress sx={{ flex: 1, height: 6, borderRadius: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Carregando todas as páginas do PNCP...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Erro com debug */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            hasDebug ? (
              <IconButton size="small" onClick={() => setDebugOpen((o) => !o)} aria-label={debugOpen ? 'Ocultar debug' : 'Mostrar debug'}>
                {debugOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            ) : null
          }
        >
          <Typography variant="body2" component="span">
            {error instanceof Error ? error.message : String(error)}
          </Typography>
          {hasDebug && (
            <Collapse in={debugOpen}>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 1.5,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 320,
                }}
              >
                {JSON.stringify(errWithDebug!.debug, null, 2)}
              </Box>
            </Collapse>
          )}
        </Alert>
      )}

      {importMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Falha no download automático. O PNCP foi aberto em nova aba para download manual.
        </Alert>
      )}
      {importSuccess === 'no-pdf' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Edital importado sem PDF. Abrindo PNCP em nova aba para download manual.
        </Alert>
      )}
      {importSuccess === 'error' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Falha no download automático. Abrindo PNCP em nova aba para visualizar e baixar manualmente.
        </Alert>
      )}
      {importSuccess && importSuccess !== 'no-pdf' && importSuccess !== 'error' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Edital importado com sucesso! Redirecionando para análise...
        </Alert>
      )}

      {/* Resultados — tabela compacta */}
      {data && (
        <>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {palavraChave.trim() ? (
              <>
                <strong>{filteredData.length}</strong> de {data.totalCarregados.toLocaleString('pt-BR')} carregados (filtro: &quot;{palavraChave}&quot;) — total no PNCP: {data.totalRegistros.toLocaleString('pt-BR')}
              </>
            ) : (
              <>
                {data.totalCarregados.toLocaleString('pt-BR')} resultado{data.totalCarregados !== 1 ? 's' : ''} carregado{data.totalCarregados !== 1 ? 's' : ''} (total no PNCP: {data.totalRegistros.toLocaleString('pt-BR')})
              </>
            )}
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Objeto</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', whiteSpace: 'nowrap' }}>Órgão / UF</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }} align="right">Valor</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', whiteSpace: 'nowrap' }}>Publicação</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper', width: 120 }} align="right">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((c) => (
                  <TableRow key={c.numeroControlePNCP} hover>
                    <TableCell sx={{ maxWidth: 320 }} title={c.objetoCompra}>
                      <Typography variant="body2" noWrap>
                        {c.objetoCompra}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.modalidadeNome} · {c.situacaoCompraNome}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{c.orgaoEntidade?.razaoSocial ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.unidadeOrgao?.municipioNome}/{c.unidadeOrgao?.ufSigla ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>{formatBRL(c.valorTotalEstimado)}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="caption">{formatDateTime(c.dataPublicacaoPncp)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Importar e analisar">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={
                            importingId === c.numeroControlePNCP
                              ? <CircularProgress size={14} />
                              : <DownloadIcon />
                          }
                          disabled={!!importingId}
                          onClick={() => handleImport(c)}
                        >
                          Importar
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!hasSearched && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>
            Clique em &quot;Buscar&quot; para carregar todos os editais do PNCP (período, UF e modalidade).
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Depois use o campo palavra-chave para filtrar a tabela.
          </Typography>
        </Box>
      )}

      {hasSearched && !isLoading && !isFetching && !error && data?.data?.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            Nenhum resultado para os filtros (período/UF/modalidade). Tente outro período ou UF.
          </Typography>
        </Box>
      )}
      {hasSearched && !isFetching && data?.data?.length && filteredData.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nenhum edital carregado contém &quot;{palavraChave}&quot;. Digite outro termo para filtrar a tabela.
        </Alert>
      )}
    </Box>
  )
}
