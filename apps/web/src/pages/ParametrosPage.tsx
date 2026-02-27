import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import SettingsIcon from '@mui/icons-material/Settings'
import CloudIcon from '@mui/icons-material/Cloud'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

type EndpointItem = {
  nome: string
  descricao: string
  metodo: string
  caminho: string
  parametros: { nome: string; descricao: string; obrigatorio: boolean; exemplo?: string }[]
}

type ApiGovStatus = {
  id: string
  nome: string
  descricao: string
  url: string
  status: 'ok' | 'erro'
  mensagem?: string
  verificadoEm: string
}

function EndpointRow({ item }: { item: EndpointItem }) {
  const [open, setOpen] = useState(false)
  const hasParams = item.parametros.length > 0

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 40 }}>
          {hasParams && (
            <IconButton size="small" onClick={() => setOpen(!open)} aria-label="expandir parâmetros">
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {item.nome}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.descricao}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            label={item.metodo}
            color={item.metodo === 'GET' ? 'default' : item.metodo === 'POST' ? 'primary' : 'secondary'}
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
            {item.caminho}
          </Typography>
        </TableCell>
      </TableRow>
      {hasParams && (
        <TableRow>
          <TableCell colSpan={4} sx={{ py: 0, borderBottom: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Parâmetros
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Obrigatório</TableCell>
                      <TableCell>Exemplo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.parametros.map((p) => (
                      <TableRow key={p.nome}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.nome}</TableCell>
                        <TableCell>{p.descricao}</TableCell>
                        <TableCell>{p.obrigatorio ? 'Sim' : 'Não'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.exemplo ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function EndpointsSection() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['parametros', 'endpoints'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ endpoints: EndpointItem[] }>('/api/parametros/endpoints')
      return res.endpoints
    },
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) {
    return (
      <Alert severity="error">
        Não foi possível carregar a lista de endpoints. Verifique se a API está no ar.
      </Alert>
    )
  }

  return (
    <TableContainer component={Card} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }} />
            <TableCell>Nome / Descrição</TableCell>
            <TableCell>Método</TableCell>
            <TableCell>Caminho</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((item) => (
            <EndpointRow key={`${item.metodo}-${item.caminho}`} item={item} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ApisGovernamentaisSection() {
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['parametros', 'apis-governamentais-status'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<{ apis: ApiGovStatus[]; verificadoEm: string }>(
        '/api/parametros/apis-governamentais-status'
      )
      return res
    },
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (error) {
    return (
      <Alert severity="error">
        Não foi possível verificar o status das APIs governamentais. Tente novamente.
      </Alert>
    )
  }

  const apis = data?.apis ?? []
  const verificadoEm = data?.verificadoEm
    ? new Date(data.verificadoEm).toLocaleString('pt-BR')
    : '—'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Última verificação: {verificadoEm}
        </Typography>
        <Button
          size="small"
          startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Verificar novamente
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {apis.map((api) => (
          <Card key={api.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {api.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {api.descricao}
                  </Typography>
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {api.url}
                  </Typography>
                  {api.mensagem && api.status === 'erro' && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                      {api.mensagem}
                    </Typography>
                  )}
                </Box>
                <Chip
                  icon={api.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={api.status === 'ok' ? 'Funcional' : 'Indisponível'}
                  color={api.status === 'ok' ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default function ParametrosPage() {
  const [tabIndex, setTabIndex] = useState(0)

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Parâmetros e APIs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Catálogo dos endpoints da API e status das APIs governamentais utilizadas pelo sistema
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_e, v) => setTabIndex(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<CloudIcon />} iconPosition="start" label="Endpoints da API" />
        <Tab icon={<SettingsIcon />} iconPosition="start" label="APIs governamentais" />
      </Tabs>

      {tabIndex === 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Lista de todos os endpoints disponíveis nesta API, com nomes em linguagem clara e parâmetros explicados. Expanda uma linha para ver os parâmetros.
          </Typography>
          <EndpointsSection />
        </>
      )}

      {tabIndex === 1 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Status em tempo real das APIs governamentais e de terceiros que o sistema utiliza (PNCP, IBGE, Brasil API, geocodificação). Use &quot;Verificar novamente&quot; para atualizar.
          </Typography>
          <ApisGovernamentaisSection />
        </>
      )}
    </Box>
  )
}
