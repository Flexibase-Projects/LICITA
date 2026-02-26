import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'
import ArticleIcon from '@mui/icons-material/Article'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useEditais } from '../hooks/useEditais'
import { apiClient } from '../services/apiClient'
import { useQueryClient } from '@tanstack/react-query'
import { formatBRL, formatDate, formatModalidade, formatViabilidade } from '../utils/formatters'
import type { Edital, ViabilidadeVeredicto } from '@licita/shared-types'

const VIABILIDADE_COLORS: Record<ViabilidadeVeredicto, 'success' | 'warning' | 'error'> = {
  viavel: 'success',
  parcialmente_viavel: 'warning',
  inviavel: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Concluído',
  analyzing: 'Analisando',
  pending: 'Pendente',
  error: 'Erro',
  extracting: 'Extraindo',
}

export default function EditalListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [viabilidade, setViabilidade] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, isLoading } = useEditais({
    search: search || undefined,
    status: (status || undefined) as Edital['status'] | undefined,
    viabilidade: (viabilidade || undefined) as ViabilidadeVeredicto | undefined,
    page,
    pageSize,
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiClient.delete(`/api/editais/${deleteId}`)
      queryClient.invalidateQueries({ queryKey: ['editais'] })
      setDeleteId(null)
    } catch {
      // erro já pode ser mostrado por interceptor ou toast
    } finally {
      setDeleting(false)
    }
  }

  const columns: GridColDef<Edital & { orgao?: { nome?: string; nome_curto?: string } }>[] = [
    {
      field: 'objeto',
      headerName: 'Objeto',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value, row }) => (
        <Typography variant="body2" sx={{ lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {value || '—'}
        </Typography>
      ),
    },
    {
      field: 'orgao',
      headerName: 'Órgão',
      width: 160,
      valueGetter: (_, row) => (row as { orgao?: { nome_curto?: string; nome?: string } }).orgao?.nome_curto ?? (row as { orgao?: { nome?: string } }).orgao?.nome ?? '—',
      renderCell: ({ value }) => (
        <Typography variant="body2" color="text.secondary" noWrap title={String(value)}>
          {value ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'modalidade',
      headerName: 'Modalidade',
      width: 140,
      renderCell: ({ value }) => (
        <Typography variant="body2">{formatModalidade(value as string)}</Typography>
      ),
    },
    {
      field: 'valor_estimado',
      headerName: 'Valor',
      width: 120,
      type: 'number',
      valueFormatter: (v) => formatBRL(v as number | null),
      renderCell: ({ value }) => (
        <Typography variant="body2" fontWeight={500}>{formatBRL(value as number | null)}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          label={STATUS_LABELS[value as string] ?? value}
          size="small"
          variant="outlined"
          color={value === 'completed' ? 'success' : value === 'error' ? 'error' : value === 'analyzing' ? 'info' : 'default'}
        />
      ),
    },
    {
      field: 'viabilidade_veredicto',
      headerName: 'Viabilidade',
      width: 130,
      renderCell: ({ value }) =>
        value ? (
          <Chip
            label={formatViabilidade(value as string)}
            size="small"
            color={VIABILIDADE_COLORS[value as ViabilidadeVeredicto] ?? 'default'}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: 'created_at',
      headerName: 'Data',
      width: 100,
      valueFormatter: (v) => formatDate(v as string),
      renderCell: ({ value }) => (
        <Typography variant="caption" color="text.secondary">{formatDate(value as string)}</Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      align: 'center',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); navigate(`/editais/${row.id}`) }}
            title="Abrir edital"
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setDeleteId(row.id) }}
            title="Excluir edital"
            color="error"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Meus Editais
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {data?.total ?? '—'} edital{(data?.total ?? 0) !== 1 ? 's' : ''} analisado{(data?.total ?? 0) !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar por objeto, órgão..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          size="small"
          sx={{ flex: 1, minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="completed">Concluído</MenuItem>
            <MenuItem value="analyzing">Analisando</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="error">Erro</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Viabilidade</InputLabel>
          <Select value={viabilidade} onChange={(e) => setViabilidade(e.target.value)} label="Viabilidade">
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="viavel">Viável</MenuItem>
            <MenuItem value="parcialmente_viavel">Parcialmente Viável</MenuItem>
            <MenuItem value="inviavel">Inviável</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabela compacta */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          minHeight: 400,
        }}
      >
        <DataGrid
          rows={data?.data ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          onRowClick={({ id }) => navigate(`/editais/${id}`)}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={{ page: page - 1, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page + 1)
            setPageSize(model.pageSize)
          }}
          rowCount={data?.total ?? 0}
          paginationMode="server"
          disableRowSelectionOnClick
          density="compact"
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { py: 0.75 },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          }}
        />
      </Box>

      {!isLoading && (!data?.data?.length) && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            Nenhum edital encontrado. Faça upload de um PDF na página inicial.
          </Typography>
        </Box>
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogTitle>Excluir edital?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. O edital e os dados da análise serão removidos permanentemente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
