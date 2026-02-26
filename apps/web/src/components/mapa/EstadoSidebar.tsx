import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import SearchIcon from '@mui/icons-material/Search'
import PlaceIcon from '@mui/icons-material/Place'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import type { MapaOrgao } from '@licita/shared-types'

interface EstadoSidebarProps {
  uf: string
  orgaos: MapaOrgao[]
  isLoading: boolean
  error: Error | null
  selectedCnpj: string | null
  onVerEdital: (orgao: MapaOrgao) => void
}

const cellBorder = '1px solid rgba(255,255,255,0.06)'
const cellPadding = '8px 12px'

function BadgeCount({ value }: { value: number }) {
  const color = value >= 5 ? '#DC2626' : value >= 2 ? '#D97706' : '#16A34A'
  return (
    <Box
      sx={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        bgcolor: `${color}20`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.6875rem',
        fontWeight: 700,
      }}
    >
      {value}
    </Box>
  )
}

export default function EstadoSidebar({
  uf,
  orgaos,
  isLoading,
  error,
  selectedCnpj,
  onVerEdital,
}: EstadoSidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = orgaos.filter(
    (o) =>
      search === '' ||
      o.nome.toLowerCase().includes(search.toLowerCase()) ||
      o.municipio.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0, bgcolor: '#0F172A' }}>
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          pt: 1.25,
          pb: 1,
          borderBottom: cellBorder,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
          <PlaceIcon sx={{ color: '#60A5FA', fontSize: 16 }} />
          <Chip
            label={uf}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.6875rem',
              fontWeight: 700,
              bgcolor: 'rgba(96, 165, 250, 0.12)',
              color: '#93C5FD',
              border: '1px solid rgba(96, 165, 250, 0.25)',
            }}
          />
          <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>
            Órgãos com editais
          </Typography>
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar órgão ou município..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ minWidth: 28 }}>
                <SearchIcon sx={{ fontSize: 16, color: '#64748B' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.04)',
              color: '#E2E8F0',
              fontSize: '0.75rem',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(96, 165, 250, 0.4)' },
            },
            '& .MuiInputBase-input': { py: 0.65 },
            '& .MuiInputBase-input::placeholder': { color: '#64748B', opacity: 0.9 },
          }}
        />
      </Box>

      {/* Conteúdo — minWidth: 0 para permitir encolher e evitar scroll horizontal */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
            <CircularProgress size={28} sx={{ color: '#60A5FA' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 1.5, fontSize: '0.75rem' }}>
            Erro ao carregar órgãos. Tente novamente.
          </Alert>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748B', fontSize: '0.75rem', lineHeight: 1.4 }}>
              {search ? 'Nenhum órgão encontrado.' : `Nenhum edital em ${uf} nos últimos 6 meses.`}
            </Typography>
          </Box>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <TableContainer
            sx={{
              flex: 1,
              overflow: 'auto',
              overflowX: 'hidden',
              maxWidth: '100%',
              minWidth: 0,
              bgcolor: '#0F172A',
            }}
          >
            <Table
              size="small"
              stickyHeader
              sx={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: '100%',
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="left"
                    sx={{
                      py: 0.75,
                      px: 1.5,
                      minWidth: 0,
                      borderBottom: cellBorder,
                      borderRight: cellBorder,
                      bgcolor: '#0F172A',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Órgão
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      py: 0.75,
                      px: 0.75,
                      width: 44,
                      maxWidth: 44,
                      borderBottom: cellBorder,
                      borderRight: cellBorder,
                      bgcolor: '#0F172A',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Nº
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: 0.75,
                      px: 1,
                      width: 82,
                      maxWidth: 82,
                      borderBottom: cellBorder,
                      bgcolor: '#0F172A',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#64748B',
                    }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((orgao) => {
                  const selected = orgao.cnpj === selectedCnpj
                  return (
                    <TableRow
                      key={orgao.cnpj}
                      sx={{
                        bgcolor: selected ? 'rgba(27, 79, 216, 0.12)' : 'transparent',
                        '&:hover': { bgcolor: selected ? 'rgba(27, 79, 216, 0.18)' : 'rgba(255,255,255,0.03)' },
                      }}
                    >
                      <TableCell
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          minWidth: 0,
                          borderBottom: cellBorder,
                          borderRight: cellBorder,
                          bgcolor: 'inherit',
                          verticalAlign: 'top',
                          overflow: 'hidden',
                        }}
                      >
                        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                          <Typography
                            noWrap
                            sx={{
                              color: '#E2E8F0',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              lineHeight: 1.3,
                            }}
                            title={orgao.nome}
                          >
                            {orgao.nome}
                          </Typography>
                          <Typography
                            noWrap
                            sx={{
                              color: '#64748B',
                              fontSize: '0.6875rem',
                              lineHeight: 1.3,
                              mt: 0.2,
                            }}
                            title={orgao.municipio}
                          >
                            {orgao.municipio}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          py: 0.75,
                          px: 0.75,
                          width: 44,
                          maxWidth: 44,
                          borderBottom: cellBorder,
                          borderRight: cellBorder,
                          bgcolor: 'inherit',
                          verticalAlign: 'middle',
                        }}
                      >
                        <BadgeCount value={orgao.total_editais} />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          py: 0.75,
                          px: 1,
                          width: 82,
                          maxWidth: 82,
                          borderBottom: cellBorder,
                          bgcolor: 'inherit',
                          verticalAlign: 'middle',
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onVerEdital(orgao)}
                          sx={{
                            fontSize: '0.625rem',
                            py: 0.25,
                            px: 0.75,
                            minWidth: 0,
                            textTransform: 'none',
                            borderColor: 'rgba(148, 163, 184, 0.35)',
                            color: '#94A3B8',
                            '&:hover': {
                              borderColor: '#60A5FA',
                              color: '#60A5FA',
                              bgcolor: 'rgba(96, 165, 250, 0.08)',
                            },
                          }}
                        >
                          Ver edital
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Rodapé */}
      {!isLoading && filtered.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderTop: cellBorder,
            flexShrink: 0,
            bgcolor: '#0F172A',
          }}
        >
          <Typography sx={{ color: '#64748B', fontSize: '0.6875rem' }}>
            {filtered.length} órgão(s)
          </Typography>
        </Box>
      )}
    </Box>
  )
}
