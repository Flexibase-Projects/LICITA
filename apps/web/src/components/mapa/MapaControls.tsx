import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import RefreshIcon from '@mui/icons-material/Refresh'
import WifiIcon from '@mui/icons-material/Wifi'

interface MapaControlsProps {
  cacheAgeMinutes: number
  isLoading: boolean
  isRefreshing?: boolean
  onRefresh: () => void
}

export default function MapaControls({
  cacheAgeMinutes,
  isLoading,
  isRefreshing = false,
  onRefresh,
}: MapaControlsProps) {
  const updating = isLoading || isRefreshing
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: '#0F172A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}
    >
      {/* Título: filtro OR = basta 1 termo */}
      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.7rem' }}>
        Filtro (1 termo já inclui):
      </Typography>

      {/* Keywords fixas — Mobiliário OU assento OU cadeira OU mesa OU armário... */}
      {['MOBILIÁRIO', 'ASSENTO', 'CADEIRA', 'MESA', 'ARMÁRIO'].map((kw) => (
        <Chip
          key={kw}
          label={kw}
          size="small"
          sx={{
            bgcolor: 'rgba(14, 164, 114, 0.15)',
            color: '#0EA472',
            border: '1px solid rgba(14, 164, 114, 0.3)',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      ))}

      <Box sx={{ flex: 1 }} />

      {/* Status: atualização automática a cada 10 min ou ao clicar em Reload */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <WifiIcon sx={{ fontSize: 14, color: cacheAgeMinutes < 5 ? '#22C55E' : '#F59E0B' }} />
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
          {cacheAgeMinutes === 0 ? 'Ao vivo' : cacheAgeMinutes >= 60 ? `Atualizado há ${Math.floor(cacheAgeMinutes / 60)} h` : `Atualizado há ${cacheAgeMinutes} min`}
        </Typography>
      </Box>

      {/* Botão refresh — ícone gira quando atualizando (automático ou ao clicar) */}
      <Tooltip title={updating ? 'Atualizando editais por estado…' : 'Atualizar dados agora (automático a cada 1 hora)'}>
        <span>
          <IconButton
            size="small"
            onClick={onRefresh}
            disabled={updating}
            className={updating ? 'refresh-icon-spin' : undefined}
            sx={{
              color: updating ? '#60A5FA' : '#94A3B8',
              '&:hover': { color: updating ? '#60A5FA' : '#F1F5F9' },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )
}
